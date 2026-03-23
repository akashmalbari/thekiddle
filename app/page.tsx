"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [parent, setParent] = useState({
    parent_name: "",
    email: "",
  });

  const [children, setChildren] = useState([
    { child_name: "", child_age: "", interest: "", other_interest: "" },
  ]);

  const [message, setMessage] = useState("");

  const addChild = () => {
    setChildren([
      ...children,
      { child_name: "", child_age: "", interest: "", other_interest: "" },
    ]);
  };

  const handleSubmit = async () => {
    if (!parent.email) {
      setMessage("Email required");
      return;
    }

    // 1. get or create parent
    let { data: existing } = await supabase
      .from("parents")
      .select("*")
      .eq("email", parent.email)
      .single();

    let parentId;

    if (existing) {
      parentId = existing.id;
    } else {
      const { data, error } = await supabase
        .from("parents")
        .insert([parent])
        .select()
        .single();

      if (error) {
        setMessage("Error saving parent");
        return;
      }

      parentId = data.id;
    }

    // 2. insert children
    const payload = children.map((c) => ({
      parent_id: parentId,
      child_name: c.child_name,
      child_age: parseInt(c.child_age),
      interests:
        c.interest === "others" ? c.other_interest : c.interest,
    }));

    const { error } = await supabase.from("children").insert(payload);

    if (error) setMessage("Error saving");
    else setMessage("Saved 🎉");
  };

  return (
    <main style={{ padding: 40 }}>
      <h1>The Kiddle 🧸</h1>

      <input
        placeholder="Parent Name"
        onChange={(e) =>
          setParent({ ...parent, parent_name: e.target.value })
        }
      />
      <br />

      <input
        placeholder="Email"
        onChange={(e) =>
          setParent({ ...parent, email: e.target.value })
        }
      />
      <br />

      <h3>Children</h3>

      {children.map((child, index) => (
        <div key={index} style={{ marginBottom: 20 }}>
          <input
            placeholder="Child Name"
            onChange={(e) => {
              const arr = [...children];
              arr[index].child_name = e.target.value;
              setChildren(arr);
            }}
          />
          <br />

          <input
            type="number"
            placeholder="Age"
            onChange={(e) => {
              const arr = [...children];
              arr[index].child_age = e.target.value;
              setChildren(arr);
            }}
          />
          <br />

          {/* dropdown */}
          <select
            onChange={(e) => {
              const arr = [...children];
              arr[index].interest = e.target.value;
              setChildren(arr);
            }}
          >
            <option value="">Select Interest</option>
            <option value="animals">Animals</option>
            <option value="space">Space</option>
            <option value="stories">Stories</option>
            <option value="science">Science</option>
            <option value="others">Others</option>
          </select>

          {/* show textbox if others */}
          {child.interest === "others" && (
            <>
              <br />
              <input
                placeholder="Enter interest"
                onChange={(e) => {
                  const arr = [...children];
                  arr[index].other_interest = e.target.value;
                  setChildren(arr);
                }}
              />
            </>
          )}
        </div>
      ))}

      <button onClick={addChild}>+ Add Child</button>
      <br /><br />

      <button onClick={handleSubmit}>Submit</button>

      <p>{message}</p>
    </main>
  );
}