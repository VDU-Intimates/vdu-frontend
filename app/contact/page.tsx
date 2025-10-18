// app/contact/page.tsx
"use client";
import { useMemo, useState } from "react";
import PrimaryButton from "../components/common-components/primary-button";
import { Send } from "lucide-react";
import NavBar from "../components/nav-bar/nav-bar";
import Footer from "../components/footer/footer";

type FormData = {
  name: string;
  phone: string;
  email: string;
  comment: string;
};

const nameRx = /^[A-Za-zÀ-ÖØ-öø-ÿ'’.-]+(?:\s+[A-Za-zÀ-ÖØ-öø-ÿ'’.-]+)+$/; // at least two words
const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
// Sri Lanka: 0XXXXXXXXX (10 digits) or +94XXXXXXXXX; also allow generic 10–15 digit intl
const lkPhoneRx = /^(?:\+94\d{9}|0\d{9}|\+?\d{10,15})$/;

function validate(values: FormData) {
  const errors: Partial<Record<keyof FormData, string>> = {};
  const name = values.name.trim();
  const phone = values.phone.trim();
  const email = values.email.trim();
  const comment = values.comment.trim();

  if (!name) errors.name = "Name is required.";
  else if (name.length < 3) errors.name = "Name must be at least 3 characters.";
  else if (!nameRx.test(name)) errors.name = "Enter full name (first & last).";

  if (!phone) errors.phone = "Phone number is required.";
  else if (!lkPhoneRx.test(phone))
    errors.phone = "Use 0XXXXXXXXX or +94XXXXXXXXX (or valid international).";

  if (!email) errors.email = "Email is required.";
  else if (!emailRx.test(email)) errors.email = "Enter a valid email address.";

  if (!comment) errors.comment = "Comment is required.";
  else if (comment.length < 10) errors.comment = "Comment must be at least 10 characters.";
  else if (comment.length > 1000) errors.comment = "Comment is too long.";

  return errors;
}

const ContactPage = () => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    phone: "",
    email: "",
    comment: "",
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const errors = useMemo(() => validate(formData), [formData]);
  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    // Optional: strip leading/trailing whitespace in realtime for some fields
    setFormData((p) => ({ ...p, [name]: name === "email" ? value.trim() : value }));
  };

  const handleBlur = (name: keyof FormData) => {
    setTouched((t) => ({ ...t, [name]: true }));
  };

  const border = (field: keyof FormData) =>
    `w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${
      touched[field] && errors[field] ? "border-red-500" : "border-gray-300"
    }`;

  const trySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!isValid) {
      // reveal all errors if user submits early
      setTouched({ name: true, phone: true, email: true, comment: true });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        "http://localhost:5000/api/contact/contact-us",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            // normalize before sending
            name: formData.name.trim(),
            phone: formData.phone.trim(),
            email: formData.email.trim(),
            comment: formData.comment.trim(),
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage("✅ Your message has been sent successfully!");
        setFormData({ name: "", phone: "", email: "", comment: "" });
        setTouched({});
      } else {
        setMessage(`❌ ${data?.message || "Something went wrong. Please try again."}`);
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      setMessage("❌ Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <NavBar />
      <div className="min-h-screen py-10">
        <div className="max-w-5xl mx-auto bg-green-100 p-8 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-center mb-8">CONTACT US</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Contact Form */}
            <form onSubmit={trySubmit} className="space-y-4" noValidate>
              <h2 className="text-2xl font-bold mb-4 text-center">Send us an email</h2>

              {/* NAME */}
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="name">
                  NAME
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={() => handleBlur("name")}
                  className={border("name")}
                  autoComplete="name"
                  disabled={loading}
                  aria-invalid={!!(touched.name && errors.name)}
                  aria-describedby="name-error"
                  required
                />
                {touched.name && errors.name && (
                  <p id="name-error" className="mt-1 text-sm text-red-600">
                    {errors.name}
                  </p>
                )}
              </div>

              {/* PHONE */}
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="phone">
                  PHONE NUMBER
                </label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={() => handleBlur("phone")}
                  className={border("phone")}
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={16}
                  disabled={loading}
                  aria-invalid={!!(touched.phone && errors.phone)}
                  aria-describedby="phone-error"
                  required
                />
                {touched.phone && errors.phone && (
                  <p id="phone-error" className="mt-1 text-sm text-red-600">
                    {errors.phone}
                  </p>
                )}
              </div>

              {/* EMAIL */}
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="email">
                  EMAIL
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => handleBlur("email")}
                  className={border("email")}
                  autoComplete="email"
                  disabled={loading}
                  aria-invalid={!!(touched.email && errors.email)}
                  aria-describedby="email-error"
                  required
                />
                {touched.email && errors.email && (
                  <p id="email-error" className="mt-1 text-sm text-red-600">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* COMMENT */}
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="comment">
                  COMMENT
                </label>
                <textarea
                  id="comment"
                  name="comment"
                  value={formData.comment}
                  onChange={handleChange}
                  onBlur={() => handleBlur("comment")}
                  rows={4}
                  className={border("comment")}
                  disabled={loading}
                  aria-invalid={!!(touched.comment && errors.comment)}
                  aria-describedby="comment-error"
                  required
                />
                {touched.comment && errors.comment && (
                  <p id="comment-error" className="mt-1 text-sm text-red-600">
                    {errors.comment}
                  </p>
                )}
              </div>

              {message && (
                <p className="text-center mt-4 text-sm text-gray-700">{message}</p>
              )}

              <div className="flex justify-center">
                <PrimaryButton
                  context={loading ? "SENDING..." : "SUBMIT"}
                  onClick={() => { /* handled by form submit */ }}
                  icon={Send}
                  type="submit"
                  
                />
              </div>
            </form>

            {/* Live Help Section */}
            <div className="bg-white rounded-3xl p-6 shadow-md grid place-items-center">
              <h2 className="text-3xl font-bold mb-4 text-center">LIVE HELP</h2>
              <p className="mb-3">
                <span className="font-semibold">Our Hotline: </span> +94 707678756
              </p>
              <p className="mb-3">
                <span className="font-semibold">Our Email: </span>{" "}
                <a href="mailto:vduin@gmail.com" className="text-green-700 hover:underline">
                  vduin@gmail.com
                </a>
              </p>
              <p>
                <span className="font-semibold">Our Address: </span> No 1008, Street 2, Kottawa.
              </p>
            </div>
          </div>
        </div>

        {/* Google Maps */}
        <div className="max-w-5xl mx-auto mt-8">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3959.678!2d79.9586!3d6.8421!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae25b9c:0x123456!2sKottawa!5e0!3m2!1sen!2slk!4v1631234567890"
            width="100%"
            height="400"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
          ></iframe>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ContactPage;
