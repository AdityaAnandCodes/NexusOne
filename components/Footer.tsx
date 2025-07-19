// Footer Section
const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: "Features", href: "#features" },
      { name: "Integrations", href: "#integrations" },
      { name: "Pricing", href: "#pricing" },
      { name: "Security", href: "#security" },
      { name: "API Documentation", href: "#api" },
    ],
    company: [
      { name: "About Us", href: "#about" },
      { name: "Careers", href: "#careers" },
      { name: "Blog", href: "#blog" },
      { name: "Press Kit", href: "#press" },
      { name: "Contact", href: "#contact" },
    ],
    support: [
      { name: "Help Center", href: "#help" },
      { name: "Community", href: "#community" },
      { name: "Status", href: "#status" },
      { name: "Changelog", href: "#changelog" },
      { name: "Support", href: "#support" },
    ],
    legal: [
      { name: "Privacy Policy", href: "#privacy" },
      { name: "Terms of Service", href: "#terms" },
      { name: "Cookie Policy", href: "#cookies" },
      { name: "GDPR", href: "#gdpr" },
      { name: "Compliance", href: "#compliance" },
    ],
  };

  const socialLinks = [
    {
      name: "Twitter",
      icon: "M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z",
      href: "#twitter",
    },
    {
      name: "LinkedIn",
      icon: "M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z",
      href: "#linkedin",
    },
    {
      name: "GitHub",
      icon: "M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22",
      href: "#github",
    },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="px-8 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <div className="mb-6">
                <h3
                  className="text-2xl font-black mb-4"
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                >
                  NexusOne
                </h3>
                <p
                  className="text-gray-300 text-lg leading-relaxed mb-6"
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                >
                  Supercharge your team's productivity with AI-powered
                  workflows, seamless integrations, and intelligent automation.
                </p>
              </div>

              {/* Newsletter Signup */}
              <div className="mb-8">
                <h4
                  className="font-semibold mb-4"
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                >
                  Stay updated
                </h4>
                <div className="flex gap-3">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-gray-500 transition-colors"
                    style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                  />
                  <button
                    className="px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
                    style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                  >
                    Subscribe
                  </button>
                </div>
                <p
                  className="text-sm text-gray-400 mt-2"
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                >
                  Get product updates and productivity tips. Unsubscribe
                  anytime.
                </p>
              </div>

              {/* Social Links */}
              <div>
                <h4
                  className="font-semibold mb-4"
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                >
                  Follow us
                </h4>
                <div className="flex gap-4">
                  {socialLinks.map((social, index) => (
                    <a
                      key={index}
                      href={social.href}
                      className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-gray-700 transition-colors"
                      aria-label={social.name}
                    >
                      <svg
                        className="w-5 h-5 text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={social.icon}
                        />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h4
                className="font-bold text-lg mb-6"
                style={{ fontFamily: "Inter, system-ui, sans-serif" }}
              >
                Product
              </h4>
              <ul className="space-y-4">
                {footerLinks.product.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-gray-300 hover:text-white transition-colors"
                      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h4
                className="font-bold text-lg mb-6"
                style={{ fontFamily: "Inter, system-ui, sans-serif" }}
              >
                Company
              </h4>
              <ul className="space-y-4">
                {footerLinks.company.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-gray-300 hover:text-white transition-colors"
                      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support & Legal Links */}
            <div>
              <h4
                className="font-bold text-lg mb-6"
                style={{ fontFamily: "Inter, system-ui, sans-serif" }}
              >
                Support
              </h4>
              <ul className="space-y-4 mb-8">
                {footerLinks.support.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-gray-300 hover:text-white transition-colors"
                      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>

              <h4
                className="font-bold text-lg mb-6"
                style={{ fontFamily: "Inter, system-ui, sans-serif" }}
              >
                Legal
              </h4>
              <ul className="space-y-4">
                {footerLinks.legal.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-gray-300 hover:text-white transition-colors"
                      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="px-8 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <p
                  className="text-gray-400 text-sm"
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                >
                  © {currentYear} NexusOne. All rights reserved.
                </p>

                {/* Trust Badges */}
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-700 rounded flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <span
                      className="text-sm text-gray-400"
                      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                    >
                      SOC 2 Compliant
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-700 rounded flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    </div>
                    <span
                      className="text-sm text-gray-400"
                      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                    >
                      GDPR Ready
                    </span>
                  </div>
                </div>
              </div>

              {/* Region/Language Selector */}
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 text-gray-400 hover:text-gray-300 transition-colors">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                    />
                  </svg>
                  <span
                    className="text-sm"
                    style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                  >
                    English (US)
                  </span>
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;