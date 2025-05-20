import React, { useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function TryOnApp() {
  const [personImage, setPersonImage] = useState(null);
  const [clothImage, setClothImage] = useState(null);
  const [outputImage, setOutputImage] = useState("");
  const [loading, setLoading] = useState(false);

  const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbxS66k3eJhYS20i_DuW8Y9P71uAJlHZ1wnRo-EDFQcsgy5Wke8odvzItQxrFNKLVtY/exec";
    

  const handleUpload = async () => {
    if (!personImage || !clothImage) {
      toast.warning("📸 Please upload or select both person and clothing images.");
      return;
    }

    const formData = new FormData();
    formData.append("personImage", personImage);
    formData.append("clothImage", clothImage);

    setLoading(true);
    setOutputImage("");

    try {
      const res = await axios.post("http://localhost:5000/api/tryon", formData);
      console.log("✅ Try-on result:", res.data);
      if (res.data.output_url) {
        setOutputImage(res.data.output_url);
      } else {
        toast.error("❌ Try-on failed. No output URL received.");
      }
    } catch (err) {
      console.error("Try-on request failed:", err);
      toast.error("❌ Try-on request failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    const rating = e.target.rating.value;
    const comment = e.target.comment.value;
    const usage = e.target.usage.value;
    const email = e.target.email.value;

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          rating,
          comment,
          usage,
          email,
          personImage: personImage?.name || "",
          clothImage: clothImage?.name || "",
          resultUrl: outputImage || "",
        }),
      });

      toast.success("✅ Feedback submitted! Thank you.");
      e.target.reset();
    } catch (err) {
      console.error("Feedback submission failed:", err);
      toast.error("⚠️ Feedback submission failed.");
    }
  };

  const loadSampleImage = async (path, setter, name) => {
    const res = await fetch(path);
    const blob = await res.blob();
    setter(new File([blob], name, { type: blob.type }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-200">
      <div className="max-w-6xl mx-auto py-10 px-4">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-blue-800 mb-2">Virtual Try-On</h1>
          <p className="text-gray-500 text-sm">Upload or choose a sample to see your outfit!</p>
        </header>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Person Image Panel */}
          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="font-semibold mb-2">Person Image</h2>
            <input type="file" accept="image/*" onChange={(e) => setPersonImage(e.target.files[0])} />
            <div className="mt-2 flex gap-2">
              {["model1.jpg", "model2.jpg", "model3.jpg"].map((f, i) => (
                <img
                  key={i}
                  src={`/sample/person/${f}`}
                  className="w-16 h-24 object-cover rounded cursor-pointer border"
                  onClick={() => loadSampleImage(`/sample/person/${f}`, setPersonImage, f)}
                />
              ))}
            </div>
            {personImage && (
              <img
                src={URL.createObjectURL(personImage)}
                alt="Person"
                className="mt-3 rounded border object-contain max-h-72 mx-auto"
              />
            )}
          </div>

          {/* Clothing Image Panel */}
          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="font-semibold mb-2">Clothing Image</h2>
            <input type="file" accept="image/*" onChange={(e) => setClothImage(e.target.files[0])} />
            <div className="mt-2 flex gap-2">
              {["top1.jpg", "top2.jpg", "top3.jpg", "top4.jpg"].map((f, i) => (
                <img
                  key={i}
                  src={`/sample/clothing/${f}`}
                  className="w-16 h-24 object-cover rounded cursor-pointer border"
                  onClick={() => loadSampleImage(`/sample/clothing/${f}`, setClothImage, f)}
                />
              ))}
            </div>
            {clothImage && (
              <img
                src={URL.createObjectURL(clothImage)}
                alt="Cloth"
                className="mt-3 rounded border object-contain max-h-72 mx-auto"
              />
            )}
          </div>

          {/* Output Image Panel */}
          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="font-semibold mb-2">Try-On Result</h2>
            {outputImage ? (
              <img
                src={outputImage}
                alt="Try-On Result"
                className="rounded border object-contain max-h-72 mx-auto"
              />
            ) : (
              <div className="text-gray-400 text-sm">Result will appear here</div>
            )}
          </div>
        </div>

        <div className="text-center mt-6">
          <button
            onClick={handleUpload}
            disabled={loading}
            className={`px-6 py-2 rounded-lg font-medium text-white transition ${
              loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Generating..." : "Try On"}
          </button>
        </div>

        {/* Feedback Form */}
        {outputImage && (
          <div className="mt-12 max-w-3xl mx-auto bg-white border border-gray-300 rounded-xl p-6 shadow-md">
            <h3 className="text-xl font-bold mb-4">We'd love your feedback! 💬</h3>
            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div>
                <label className="block font-medium">Rating</label>
                <select name="rating" required className="mt-1 w-full rounded border p-2">
                  <option value="">Select rating</option>
                  <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
                  <option value="4">⭐⭐⭐⭐ Good</option>
                  <option value="3">⭐⭐⭐ Okay</option>
                  <option value="2">⭐⭐ Poor</option>
                  <option value="1">⭐ Very Poor</option>
                </select>
              </div>
              <div>
                <label className="block font-medium">Use Case</label>
                <select name="usage" required className="mt-1 w-full rounded border p-2">
                  <option value="">Select reason</option>
                  <option value="Just for fun">Just for fun</option>
                  <option value="I want to buy this outfit">I want to buy this outfit</option>
                  <option value="I'm comparing options">I'm comparing options</option>
                  <option value="Research or project use">Research or project use</option>
                </select>
              </div>
              <div>
                <label className="block font-medium">Email (optional)</label>
                <input type="email" name="email" placeholder="you@example.com" className="mt-1 w-full rounded border p-2" />
              </div>
              <div>
                <label className="block font-medium">Comments</label>
                <textarea name="comment" rows="3" placeholder="Type your feedback here." className="mt-1 w-full rounded border p-2"></textarea>
              </div>
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                Submit Feedback
              </button>
            </form>
          </div>
        )}
      </div>
      <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar />
    </div>
  );
}
