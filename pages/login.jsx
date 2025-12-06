"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useSupabaseClient();

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

    if (error) setErrors({ general: error.message });
    else router.push("/");

    setLoading(false);
  };

  return (
    <main className="relative min-h-screen bg-black flex items-center justify-center px-4 overflow-hidden">

      {/* Floating circles */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-green-600 rounded-full blur-3xl opacity-30 animate-float1"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-500 rounded-full blur-3xl opacity-20 animate-float2"></div>

      <div className="relative w-full max-w-5xl h-[calc(100vh-2rem)] bg-black/90 backdrop-blur-md rounded-3xl shadow-xl grid md:grid-cols-2 overflow-hidden">

        {/* LEFT BRANDING */}
        <div className="hidden md:flex flex-col justify-center p-10 bg-gradient-to-br from-gray-900 to-black text-white">
          <h1 className="text-4xl font-bold mb-4 leading-tight">
            Welcome Back
          </h1>
          <p className="text-gray-300 max-w-sm">
            Log in to your account and get back to buying and selling items effortlessly.
          </p>
        </div>

        {/* RIGHT FORM */}
        <div className="flex flex-col justify-center p-8 overflow-auto">
          <h2 className="text-3xl font-bold mb-2 text-green-400">Login</h2>
          <p className="text-gray-400 mb-6 text-sm">
            Access your marketplace account.
          </p>

          {errors.general && <div className="text-red-500 text-sm mb-4">{errors.general}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* EMAIL */}
            <div>
              <label className="text-sm font-medium text-white">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className={`w-full mt-1 p-3 rounded-lg text-sm bg-black text-white border ${
                  errors.email ? "border-red-500" : "border-green-500/30"
                } focus:ring-2 focus:ring-green-400 outline-none`}
              />
            </div>

            {/* PASSWORD */}
            <div>
              <label className="text-sm font-medium text-white">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className={`w-full mt-1 p-3 pr-10 rounded-lg text-sm bg-black text-white border ${
                    errors.password ? "border-red-500" : "border-green-500/30"
                  } focus:ring-2 focus:ring-green-400 outline-none`}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-400 hover:bg-green-500 text-black font-semibold p-3 rounded-lg transition disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="text-center text-gray-400 mt-6 text-sm">
            Don’t have an account?{" "}
            <a href="/signup" className="text-green-400 font-semibold underline">
              Sign Up
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}

LoginPage.getLayout = (page) => <>{page}</>;
LoginPage.hideChat = true;
