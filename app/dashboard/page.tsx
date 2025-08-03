"use client";

import { SignedIn, SignedOut, SignIn, useUser, UserButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Event = {
  id: number;
  title: string;
  tier: string;
  description: string;
  event_date?: string;
  image_url?: string;
};

const TIER_ORDER = ["free", "silver", "gold", "platinum"];
const ALL_TIERS = ["All", ...TIER_ORDER];
const adminEmail = "priyankasmpriyankasm9@gmail.com"; // <-- Confirm this is your actual Clerk email

export default function DashboardPage() {
  const { user } = useUser();
const isAdmin =
  !!user?.primaryEmailAddress?.emailAddress &&
  user.primaryEmailAddress.emailAddress.toLowerCase() === adminEmail.toLowerCase();
    console.log("👤 Logged in as:", user?.primaryEmailAddress?.emailAddress);
console.log("✅ isAdmin:", isAdmin);


  const [events, setEvents] = useState<Event[]>([]);
  const [selectedTier, setSelectedTier] = useState<string>("All");
  const [userTier, setUserTier] = useState<string | null>(null);
  const [isTierSelectable, setIsTierSelectable] = useState<boolean>(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    tier: "free",
    event_date: "",
    image_url: "",
  });

  useEffect(() => {
    if (!user) return;

    const fetchUserTier = async () => {
      const { data, error } = await supabase
        .from("user_tiers")
        .select("tier")
        .eq("user_id", user.id);

      if (error) {
        console.error("❌ Error fetching user tier:", error.message);
        return;
      }

      if (!data || data.length === 0) {
        setIsTierSelectable(true);
        setUserTier(null);
        return;
      }

      const tier = data[0].tier?.toLowerCase() || "free";
      setUserTier(tier);
    };

    const fetchEvents = async () => {
      const { data, error } = await supabase.from("events").select("*");
      if (error) {
        console.error("❌ Error fetching events:", error.message);
      } else {
        setEvents(data || []);
      }
    };

    fetchUserTier();
    fetchEvents();
  }, [user]);

  const handleTierSelect = async (tier: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("user_tiers")
      .insert([{ user_id: user.id, tier }]);

    if (error) {
      console.error("❌ Error saving tier:", error.message);
    } else {
      setUserTier(tier);
      setIsTierSelectable(false);
    }
  };

  const startEditing = (event: Event) => {
    setEditingEvent(event);
    setEditForm({
      title: event.title,
      description: event.description,
      tier: event.tier,
      event_date: event.event_date || "",
      image_url: event.image_url || "",
    });
  };

  const getBadgeColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case "free":
        return "bg-gray-300 text-black";
      case "silver":
        return "bg-gray-400 text-white";
      case "gold":
        return "bg-yellow-400 text-black";
      case "platinum":
        return "bg-purple-600 text-white";
      default:
        return "bg-gray-200 text-black";
    }
  };

  if (!user || (userTier === null && !isTierSelectable)) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-500 dark:text-gray-300">Loading dashboard...</p>
      </div>
    );
  }

  let visibleEvents = events;
  if (!isAdmin && userTier) {
    const allowedIndex = TIER_ORDER.indexOf(userTier.toLowerCase());
    visibleEvents = events.filter((event) => {
      const eventIndex = TIER_ORDER.indexOf(event.tier.toLowerCase());
      return eventIndex <= allowedIndex;
    });
  }

  const filteredEvents =
    selectedTier === "All"
      ? visibleEvents
      : visibleEvents.filter(
          (event) => event.tier.toLowerCase() === selectedTier.toLowerCase()
        );

  return (
    <>
      <SignedIn>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-black dark:text-white">
              Event Showcase by Tier
            </h1>
            <UserButton afterSignOutUrl="/sign-in" />
          </div>

          {isTierSelectable && (
            <div className="mb-6 bg-yellow-100 p-4 rounded">
              <p className="mb-2 font-medium text-gray-800">
                Please select your access tier:
              </p>
              <div className="flex gap-2 flex-wrap">
                {TIER_ORDER.map((tier) => (
                  <button
                    key={tier}
                    onClick={() => handleTierSelect(tier)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    {tier.charAt(0).toUpperCase() + tier.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}


{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}


{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}


{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}


{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}


{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}


{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}


{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}


{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full text-gray-800 rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}


         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}


         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}

         {editingEvent && (
  <div className="mb-8 bg-white border border-gray-300 shadow-lg rounded-lg p-6 max-w-xl mx-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Event</h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tier</label>
        <select
          value={editForm.tier}
          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={editForm.event_date.slice(0, 10)}
          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="text"
          value={editForm.image_url}
          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div className="mt-6 flex gap-4">
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("events")
            .update({
              title: editForm.title,
              description: editForm.description,
              tier: editForm.tier,
              event_date: editForm.event_date,
              image_url: editForm.image_url,
            })
            .eq("id", editingEvent.id);

          if (error) {
            console.error("❌ Failed to update:", error.message);
          } else {
            const { data: updatedEvents } = await supabase.from("events").select("*");
            setEvents(updatedEvents || []);
            setEditingEvent(null);
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save Changes
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  </div>
)}


          {/* Tier Filter */}
          <div className="mb-6 flex gap-2 flex-wrap">
            {ALL_TIERS.map((tier) => (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                className={`px-4 py-2 rounded-full border ${
                  selectedTier === tier
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-white"
                }`}
              >
                {tier.charAt(0).toUpperCase() + tier.slice(1)}
              </button>
            ))}
          </div>

          {/* Events Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="p-4 border rounded-lg shadow-sm bg-gray-50 dark:bg-gray-800"
              >
                {event.image_url && (
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-40 object-cover rounded mb-2"
                  />
                )}

                <div
                  className={`inline-block px-3 py-1 mb-2 text-xs font-semibold rounded-full ${getBadgeColor(
                    event.tier
                  )}`}
                >
                  {event.tier.toUpperCase()}
                </div>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {event.title}
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  {event.description}
                </p>

                {event.event_date && (
                  <p className="text-xs text-gray-500 mt-2">
                    📅{" "}
                    {new Intl.DateTimeFormat("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }).format(new Date(event.event_date))}
                  </p>
                )}

                {isAdmin && (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => startEditing(event)}
                      className="px-4 py-2 text-sm font-semibold bg-yellow-500 text-white rounded hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={async () => {
                        const { error } = await supabase
                          .from("events")
                          .delete()
                          .eq("id", event.id);
                        if (error) {
                          console.error("❌ Failed to delete:", error.message);
                        } else {
                          setEvents((prev) => prev.filter((e) => e.id !== event.id));
                        }
                      }}
                      className="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
            {filteredEvents.length === 0 && (
              <p className="text-gray-400 dark:text-gray-500">
                No events in this tier.
              </p>
            )}
          </div>
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
  
