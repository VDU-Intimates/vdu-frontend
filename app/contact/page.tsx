// app/contact/page.tsx
"use client";
import { useState } from "react";
import PrimaryButton from "../components/common-components/primary-button";
import { Send } from "lucide-react";

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    comment: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("http://localhost:5000/api/contact/contact-us", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("✅ Your message has been sent successfully!");
        setFormData({ name: "", phone: "", email: "", comment: "" });
      } else {
        setMessage(`❌ ${data.message || 'Something went wrong. Please try again.'}`);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setMessage("❌ Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-10">
      <div className="max-w-5xl mx-auto bg-green-100 p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center mb-8">CONTACT US</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-2xl font-bold mb-4 text-center">Send us an email</h2>

            <div>
              <label className="block text-sm font-medium mb-1">NAME</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">PHONE NUMBER</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">EMAIL</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">COMMENT</label>
              <textarea
                name="comment"
                value={formData.comment}
                onChange={handleChange}
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                disabled={loading}
              />
            </div>

            {message && (
              <p className="text-center mt-4 text-sm text-gray-700">{message}</p>
            )}

            <div className="flex justify-center">
              <PrimaryButton
                context={loading ? "SENDING..." : "SUBMIT"}
                onClick={() => {}} // onClick is handled by form submission
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
              <a
                href="mailto:vduin@gmail.com"
                className="text-green-700 hover:underline"
              >
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
  );
};

export default ContactPage;