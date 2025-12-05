"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

function Signup() {
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
    if (!form.email) errs.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Invalid email format.";
    if (!form.password) errs.password = "Password is required.";
    else {
      if (!/[A-Z]/.test(form.password))
        errs.password = "Must contain an uppercase letter.";
      else if (!/[a-z]/.test(form.password))
        errs.password = "Must contain a lowercase letter.";
      else if (!/[0-9]/.test(form.password))
        errs.password = "Must contain a number.";
      else if (!/[\W]/.test(form.password))
        errs.password = "Must contain a special character.";
      else if (form.password.length < 8)
        errs.password = "Must be at least 8 characters.";
    }
    if (!form.terms) errs.terms = "You must agree to the Terms & Privacy.";
    return errs;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
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
      options: {
        data: {
          first_name: form.first_name,
          last_name: form.last_name,
        },
      },
    });

    if (!error && data.user) {
      await new Promise((r) => setTimeout(r, 300));

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          fname: form.first_name,
          lname: form.last_name,
        })
        .eq("auth_id", data.user.id);

      if (updateError) console.error("Profile update failed:", updateError);
    }

    if (error) {
      setErrors({ general: error.message });
    } else {
      router.push("/login?success=1");
    }
    setLoading(false);
  };

  return (
    <main className="bg-white min-h-screen">  
      <div className="flex justify-center px-5 py-10">
        <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
          <h2 className="text-2xl font-bold mb-8 text-center">Create Your Account</h2>

          {errors.general && (
            <div className="text-red-600 text-sm mb-4">{errors.general}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold mb-1">First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  className={`w-full p-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                    errors.first_name ? "border-red-600" : "border-gray-300"
                  }`}
                />
                {errors.first_name && (
                  <div className="text-red-600 text-xs mt-1">{errors.first_name}</div>
                )}
              </div>

              <div className="flex-1">
                <label className="block text-sm font-semibold mb-1">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  className={`w-full p-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                    errors.last_name ? "border-red-600" : "border-gray-300"
                  }`}
                />
                {errors.last_name && (
                  <div className="text-red-600 text-xs mt-1">{errors.last_name}</div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Email Address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className={`w-full p-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                  errors.email ? "border-red-600" : "border-gray-300"
                }`}
              />
              {errors.email && (
                <div className="text-red-600 text-xs mt-1">{errors.email}</div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className={`w-full p-3 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                    errors.password ? "border-red-600" : "border-gray-300"
                  }`}
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

            <div className="text-sm text-gray-700">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  name="terms"
                  checked={form.terms}
                  onChange={handleChange}
                  className="form-checkbox"
                />
                I agree to the{" "}
                <a href="#" className="text-blue-600 hover:underline">
                  Terms & Conditions
                </a>{" "}
                and{" "}
                <a href="#" className="text-blue-600 hover:underline">
                  Privacy Policy
                </a>.
              </label>
              {errors.terms && (
                <div className="text-red-600 text-xs mt-1">{errors.terms}</div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white p-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>

          <div className="my-4 text-center text-gray-400">OR</div>
          <div className="text-center text-sm">
            Already have an account?{" "}
            <a href="/login" className="text-blue-600 font-semibold hover:underline">
              Login here
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

// ✅ Skip default layout and header for this page
Signup.getLayout = (page) => <>{page}</>;
Signup.hideChat = true;

export default Signup;
