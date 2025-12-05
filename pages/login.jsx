"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useSupabaseClient(); // ✅ use the context-provided client
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    if (!form.email || !form.password) {
      setErrors({ general: "Please fill out all fields." });
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (error) {
      setErrors({ general: error.message });
    } else {
      router.push("/");
    }

    setLoading(false);
  };

  return (
    <main className="bg-white text-gray-900 font-sans min-h-screen">
      {/* ✅ Logo-only header */}

      <div className="flex justify-center px-5 py-10">
        <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
          <h2 className="text-2xl font-bold mb-8 text-center">Welcome Back!</h2>

          {errors.general && (
            <div className="text-red-600 text-sm mb-4">{errors.general}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-1" htmlFor="email">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className={`w-full p-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                  errors.email ? "border-red-600" : "border-gray-300"
                }`}
                required
              />
              {errors.email && (
                <div className="text-red-600 text-xs mt-1">{errors.email}</div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className={`w-full p-3 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                    errors.password ? "border-red-600" : "border-gray-300"
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  👁
                </button>
              </div>
              {errors.password && (
                <div className="text-red-600 text-xs mt-1">{errors.password}</div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white p-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="my-4 text-center text-gray-400">OR</div>

          <div className="text-center text-sm">
            Don’t have an account?{" "}
            <a href="/signup" className="text-blue-600 font-semibold hover:underline">
              Create one
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
