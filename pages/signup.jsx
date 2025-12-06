"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

export default function Signup() {
  const router = useRouter();
  const supabase = useSupabaseClient();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    terms: false,
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.first_name) errs.first_name = "First name is required.";
    if (!form.last_name) errs.last_name = "Last name is required.";
    if (!form.email) errs.email = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
      ? "Invalid email format." : "Email is required.";
    if (!form.password) errs.password = "Password is required.";
    else {
      if (!/[A-Z]/.test(form.password)) errs.password = "Must contain an uppercase letter.";
      else if (!/[a-z]/.test(form.password)) errs.password = "Must contain a lowercase letter.";
      else if (!/[0-9]/.test(form.password)) errs.password = "Must contain a number.";
      else if (!/[\W]/.test(form.password)) errs.password = "Must contain a special character.";
      else if (form.password.length < 8) errs.password = "Must be at least 8 characters.";
    }
    if (!form.terms) errs.terms = "You must agree to the Terms & Privacy.";
    return errs;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { first_name: form.first_name, last_name: form.last_name } },
    });

    if (!error && data.user) {
      await supabase
        .from("profiles")
        .update({ fname: form.first_name, lname: form.last_name })
        .eq("auth_id", data.user.id);
    }

    if (error) setErrors({ general: error.message });
    else router.push("/login?success=1");

    setLoading(false);
  };

  return (
    <main className="relative min-h-screen bg-black flex items-center justify-center overflow-hidden px-4">

      {/* Floating circles */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-green-600 rounded-full blur-3xl opacity-30 animate-float1"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-500 rounded-full blur-3xl opacity-20 animate-float2"></div>

      <div className="relative w-full max-w-5xl h-[calc(100vh-2rem)] bg-black/90 backdrop-blur-md rounded-3xl shadow-xl grid md:grid-cols-2 overflow-hidden">

        {/* LEFT BRANDING */}
        <div className="hidden md:flex flex-col justify-center p-10 bg-gradient-to-br from-gray-900 to-black text-white">
          <h1 className="text-4xl font-bold mb-4 leading-tight">
            Fast, Efficient & Productive
          </h1>
          <p className="text-gray-300 max-w-sm">
            Buy and sell second-hand items easily. Connect with trusted sellers and discover great deals.
          </p>
        </div>

        {/* RIGHT FORM */}
        <div className="flex flex-col justify-center p-8 overflow-auto">
          <h2 className="text-3xl font-bold mb-2 text-green-400">Sign Up</h2>
          <p className="text-gray-400 mb-6 text-sm">
            Create your account to start selling and buying.
          </p>

          {errors.general && <div className="text-red-500 text-sm mb-4">{errors.general}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name Fields */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-white">First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  className={`w-full mt-1 p-3 rounded-lg text-sm bg-black text-white border ${
                    errors.first_name ? "border-red-500" : "border-green-500/30"
                  } focus:ring-2 focus:ring-green-400 outline-none`}
                />
                {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-white">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  className={`w-full mt-1 p-3 rounded-lg text-sm bg-black text-white border ${
                    errors.last_name ? "border-red-500" : "border-green-500/30"
                  } focus:ring-2 focus:ring-green-400 outline-none`}
                />
                {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>}
              </div>
            </div>

            {/* Email */}
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
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-medium text-white">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className={`w-full mt-1 p-3 rounded-lg text-sm pr-10 bg-black text-white border ${
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
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Terms */}
            <label className="flex items-center gap-3 text-sm mt-2 text-white">
              <input
                type="checkbox"
                name="terms"
                checked={form.terms}
                onChange={handleChange}
                className="w-4 h-4 accent-green-400"
              />
              <span>
                I agree to the{" "}
                <a href="#" className="text-green-400 underline">Terms & Conditions</a> and{" "}
                <a href="#" className="text-green-400 underline">Privacy Policy</a>.
              </span>
            </label>
            {errors.terms && <p className="text-red-500 text-xs">{errors.terms}</p>}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-400 hover:bg-green-500 text-black font-semibold p-3 rounded-lg transition disabled:opacity-50"
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>

          <p className="text-center text-gray-400 mt-6 text-sm">
            Already have an account?{" "}
            <a href="/login" className="text-green-400 font-semibold underline">Log In</a>
          </p>
        </div>
      </div>
    </main>
  );
}

Signup.getLayout = (page) => <>{page}</>;
Signup.hideChat = true;
