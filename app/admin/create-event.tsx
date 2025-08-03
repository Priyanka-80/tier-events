"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { SignedIn, SignedOut, SignIn } from "@clerk/nextjs";

export default function AdminPage() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_date: "",
    image_url: "",
    tier: "free",
  });

  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("events").insert([formData]);

    if (error) {
      alert("Error adding event: " + error.message);
    } else {
      alert("Event added successfully!");
      router.push("/dashboard");
    }
  };

  return (
    <>
      <SignedIn>
        <div className="max-w-lg mx-auto mt-10 p-6 bg-white dark:bg-gray-900 rounded shadow">
          <h2 className="text-xl font-bold mb-4 text-black dark:text-white">
            Add New Event
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              name="title"
              onChange={handleChange}
              value={formData.title}
              placeholder="Title"
              className="w-full p-2 border text-black dark:text-white bg-white dark:bg-gray-800"
              required
            />
            <textarea
              name="description"
              onChange={handleChange}
              value={formData.description}
              placeholder="Description"
              className="w-full p-2 border text-black dark:text-white bg-white dark:bg-gray-800"
              required
            />
            <input
              type="datetime-local"
              name="event_date"
              onChange={handleChange}
              value={formData.event_date}
              className="w-full p-2 border text-black dark:text-white bg-white dark:bg-gray-800"
              required
            />
            <input
              name="image_url"
              onChange={handleChange}
              value={formData.image_url}
              placeholder="Image URL"
              className="w-full p-2 border text-black dark:text-white bg-white dark:bg-gray-800"
            />
            <select
              name="tier"
              onChange={handleChange}
              value={formData.tier}
              className="w-full p-2 border text-black dark:text-white bg-white dark:bg-gray-800"
            >
              <option value="free">Free</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
              <option value="platinum">Platinum</option>
            </select>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
            >
              Add Event
            </button>
          </form>
        </div>
      </SignedIn>

      <SignedOut>
        <div className="flex justify-center items-center h-screen">
          <SignIn path="/sign-in" routing="path" />
        </div>
      </SignedOut>
    </>
  );
}
