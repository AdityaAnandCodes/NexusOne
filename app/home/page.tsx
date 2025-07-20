"use client";
import HeroSection from "@/components/HeroSection";
import Navbar from "@/components/Navbar";

const Home = () => {
  return (
    <section className="bg-white">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <TestimonialsSection />
      <PricingSection />
      <FAQSection />
      <Footer />
    </section>
  );
};

import React, { useState, useEffect } from "react";
import {
  ChevronRight,
  Mail,
  Github,
  FileText,
  Layers,
  CheckCircle,
  ArrowRight,
  Zap,
  Users,
  Clock,
  Play,
  Shield,
  BarChart3,
  Brain,
  Sparkles,
  MessageSquare,
  Calendar,
  Database,
  Globe,
  Star,
  ChevronDown,
  X,
  Menu,
} from "lucide-react";
import Footer from "@/components/Footer";

// Features Section
const FeaturesSection = () => {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Insights",
      description:
        "Get intelligent recommendations and automated workflows powered by advanced machine learning algorithms.",
      color: "from-gray-900 to-gray-700",
    },
    {
      icon: Zap,
      title: "Lightning Fast Setup",
      description:
        "Deploy and configure your workspace in minutes, not hours. Our streamlined onboarding gets you productive instantly.",
      color: "from-gray-800 to-gray-600",
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description:
        "Bank-level encryption, SOC 2 compliance, and advanced security protocols keep your data safe and secure.",
      color: "from-gray-700 to-gray-500",
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description:
        "Seamless team workflows with real-time collaboration, shared workspaces, and intelligent task management.",
      color: "from-gray-900 to-gray-600",
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description:
        "Comprehensive insights into productivity metrics, team performance, and workflow optimization opportunities.",
      color: "from-gray-800 to-gray-500",
    },
    {
      icon: Globe,
      title: "Global Integrations",
      description:
        "Connect with 100+ apps and services including Slack, Teams, Salesforce, and all your favorite tools.",
      color: "from-gray-600 to-gray-400",
    },
  ];

  return (
    <section className="px-8 py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 mb-6">
            <Sparkles className="w-4 h-4 text-gray-900" />
            <span
              className="text-sm font-semibold tracking-wide"
              style={{
                fontFamily: "Inter, system-ui, sans-serif",
                color: "#0E0E0E",
              }}
            >
              POWERFUL FEATURES
            </span>
          </div>
          <h2
            className="text-5xl font-black mb-6"
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              color: "#0E0E0E",
            }}
          >
            Everything you need to
            <br />
            <span className="text-gray-700">supercharge productivity</span>
          </h2>
          <p
            className="text-xl opacity-80 max-w-3xl mx-auto"
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              color: "#0E0E0E",
            }}
          >
            From AI-powered automation to enterprise-grade security, NexusOne
            provides all the tools your team needs to work smarter, not harder.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-2xl p-8 border border-gray-200 hover:border-gray-400 hover:shadow-xl transition-all duration-500 cursor-pointer overflow-hidden"
              onMouseEnter={() => setHoveredFeature(index)}
              onMouseLeave={() => setHoveredFeature(null)}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
              ></div>

              <div className="relative z-10">
                <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>

                <h3
                  className="text-xl font-bold mb-4 group-hover:text-gray-900 transition-colors"
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    color: "#0E0E0E",
                  }}
                >
                  {feature.title}
                </h3>

                <p
                  className="text-gray-600 leading-relaxed mb-6"
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                >
                  {feature.description}
                </p>

                <div className="flex items-center text-sm font-semibold text-gray-700 group-hover:text-black transition-colors">
                  Learn more
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Testimonials Section
const TestimonialsSection = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      quote:
        "NexusOne transformed our onboarding process completely. What used to take weeks now happens in days, and our new employees are productive from day one.",
      author: "Sarah Chen",
      role: "Head of People Operations",
      company: "TechFlow Inc.",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
    },
    {
      quote:
        "The AI insights are game-changing. NexusOne helped us identify workflow bottlenecks we didn't even know existed and increased our team productivity by 40%.",
      author: "Michael Rodriguez",
      role: "Engineering Manager",
      company: "DataSync Solutions",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    },
    {
      quote:
        "Finally, a platform that actually integrates with everything we use. The setup was seamless, and our team adopted it immediately without any training.",
      author: "Emily Watson",
      role: "Operations Director",
      company: "CloudVision",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="px-8 py-20 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full border border-gray-200 mb-6">
            <MessageSquare className="w-4 h-4 text-gray-900" />
            <span
              className="text-sm font-semibold tracking-wide"
              style={{
                fontFamily: "Inter, system-ui, sans-serif",
                color: "#0E0E0E",
              }}
            >
              CUSTOMER SUCCESS
            </span>
          </div>
          <h2
            className="text-5xl font-black mb-6"
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              color: "#0E0E0E",
            }}
          >
            Loved by teams
            <br />
            <span className="text-gray-700">around the world</span>
          </h2>
        </div>

        {/* Testimonial Cards */}
        <div className="relative">
          <div
            className="flex transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${currentTestimonial * 100}%)` }}
          >
            {testimonials.map((testimonial, index) => (
              <div key={index} className="w-full flex-shrink-0 px-4">
                <div className="bg-gray-50 rounded-2xl p-12 border border-gray-200 max-w-4xl mx-auto">
                  <div className="flex items-center mb-8">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-5 h-5 text-gray-900 fill-current"
                      />
                    ))}
                  </div>

                  <blockquote
                    className="text-2xl leading-relaxed mb-8 font-medium"
                    style={{
                      fontFamily: "Inter, system-ui, sans-serif",
                      color: "#0E0E0E",
                    }}
                  >
                    "{testimonial.quote}"
                  </blockquote>

                  <div className="flex items-center">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.author}
                      className="w-14 h-14 rounded-full mr-4 object-cover"
                    />
                    <div>
                      <div
                        className="font-bold text-lg"
                        style={{
                          fontFamily: "Inter, system-ui, sans-serif",
                          color: "#0E0E0E",
                        }}
                      >
                        {testimonial.author}
                      </div>
                      <div
                        className="text-gray-600"
                        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                      >
                        {testimonial.role} • {testimonial.company}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Testimonial Indicators */}
          <div className="flex justify-center mt-8 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentTestimonial ? "bg-gray-900" : "bg-gray-300"
                }`}
                onClick={() => setCurrentTestimonial(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// Pricing Section
const PricingSection = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: "Starter",
      description: "Perfect for small teams getting started",
      monthlyPrice: 29,
      annualPrice: 24,
      features: [
        "Up to 5 team members",
        "Core AI integrations",
        "Basic analytics",
        "Email support",
        "Standard security",
      ],
      popular: false,
    },
    {
      name: "Professional",
      description: "Ideal for growing teams and businesses",
      monthlyPrice: 79,
      annualPrice: 65,
      features: [
        "Up to 25 team members",
        "Advanced AI features",
        "Custom integrations",
        "Priority support",
        "Advanced analytics",
        "SOC 2 compliance",
      ],
      popular: true,
    },
    {
      name: "Enterprise",
      description: "For large organizations with custom needs",
      monthlyPrice: 149,
      annualPrice: 125,
      features: [
        "Unlimited team members",
        "Custom AI training",
        "White-label options",
        "Dedicated success manager",
        "Custom security controls",
        "SLA guarantee",
      ],
      popular: false,
    },
  ];

  return (
    <section className="px-8 py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 mb-6">
            <BarChart3 className="w-4 h-4 text-gray-900" />
            <span
              className="text-sm font-semibold tracking-wide"
              style={{
                fontFamily: "Inter, system-ui, sans-serif",
                color: "#0E0E0E",
              }}
            >
              SIMPLE PRICING
            </span>
          </div>
          <h2
            className="text-5xl font-black mb-6"
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              color: "#0E0E0E",
            }}
          >
            Choose the perfect plan
            <br />
            <span className="text-gray-700">for your team</span>
          </h2>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <span
              className={`font-semibold ${
                !isAnnual ? "text-gray-900" : "text-gray-500"
              }`}
              style={{ fontFamily: "Inter, system-ui, sans-serif" }}
            >
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
                isAnnual ? "bg-gray-900" : "bg-gray-300"
              }`}
            >
              <div
                className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${
                  isAnnual ? "translate-x-7" : "translate-x-1"
                }`}
              ></div>
            </button>
            <span
              className={`font-semibold ${
                isAnnual ? "text-gray-900" : "text-gray-500"
              }`}
              style={{ fontFamily: "Inter, system-ui, sans-serif" }}
            >
              Annual
            </span>
            {isAnnual && (
              <span className="bg-gray-900 text-white px-3 py-1 rounded-full text-sm font-semibold">
                Save 20%
              </span>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-2xl p-8 border-2 transition-all duration-300 hover:shadow-xl ${
                plan.popular
                  ? "border-gray-900 shadow-lg scale-105"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gray-900 text-white px-4 py-2 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <h3
                  className="text-2xl font-bold mb-2"
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    color: "#0E0E0E",
                  }}
                >
                  {plan.name}
                </h3>
                <p
                  className="text-gray-600 mb-6"
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                >
                  {plan.description}
                </p>

                <div className="mb-6">
                  <span
                    className="text-5xl font-black"
                    style={{
                      fontFamily: "Inter, system-ui, sans-serif",
                      color: "#0E0E0E",
                    }}
                  >
                    ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                  </span>
                  <span
                    className="text-gray-600 ml-2"
                    style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                  >
                    /month
                  </span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-gray-700 mr-3 flex-shrink-0" />
                    <span
                      className="text-gray-600"
                      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 ${
                  plan.popular
                    ? "bg-gray-900 text-white hover:bg-gray-800"
                    : "border-2 border-gray-300 text-gray-900 hover:border-gray-900 hover:bg-gray-50"
                }`}
                style={{ fontFamily: "Inter, system-ui, sans-serif" }}
              >
                Get Started
              </button>
            </div>
          ))}
        </div>

        {/* Enterprise CTA */}
        <div className="text-center mt-12">
          <p
            className="text-gray-600 mb-4"
            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
          >
            Need a custom solution for your enterprise?
          </p>
          <button
            className="text-gray-900 font-semibold hover:underline"
            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
          >
            Contact our sales team →
          </button>
        </div>
      </div>
    </section>
  );
};

// FAQ Section
const FAQSection = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "How does NexusOne integrate with existing tools?",
      answer:
        "NexusOne connects seamlessly with over 100+ popular tools including Gmail, GitHub, Notion, Jira, Slack, and more. Our integration process is designed to be plug-and-play with most workflows requiring minimal setup time.",
    },
    {
      question: "Is my data secure with NexusOne?",
      answer:
        "Absolutely. We use bank-level encryption, are SOC 2 compliant, and follow strict data privacy protocols. Your data is encrypted both in transit and at rest, and we never share your information with third parties.",
    },
    {
      question: "How quickly can I onboard my team?",
      answer:
        "Most teams are up and running within 15 minutes. Our AI-powered onboarding process automatically configures your workspace based on your existing tools and workflows, making the transition seamless.",
    },
    {
      question: "What kind of support do you provide?",
      answer:
        "We offer 24/7 support through chat and email for all plans. Professional and Enterprise customers get priority support with guaranteed response times. Enterprise customers also get a dedicated success manager.",
    },
    {
      question: "Can I customize NexusOne for my specific needs?",
      answer:
        "Yes! Professional and Enterprise plans include custom integrations and workflows. Our API allows you to build custom connections, and our team can help you create tailored solutions for your unique requirements.",
    },
    {
      question: "Is there a free trial available?",
      answer:
        "Yes, we offer a 14-day free trial with full access to all features. No credit card required to get started. You can upgrade, downgrade, or cancel at any time during or after the trial period.",
    },
  ];

  return (
    <section className="px-8 py-20 bg-white">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full border border-gray-200 mb-6">
            <MessageSquare className="w-4 h-4 text-gray-900" />
            <span
              className="text-sm font-semibold tracking-wide"
              style={{
                fontFamily: "Inter, system-ui, sans-serif",
                color: "#0E0E0E",
              }}
            >
              FREQUENTLY ASKED
            </span>
          </div>
          <h2
            className="text-5xl font-black mb-6"
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              color: "#0E0E0E",
            }}
          >
            Common questions
            <br />
            <span className="text-gray-700">answered</span>
          </h2>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-xl overflow-hidden hover:border-gray-400 transition-colors duration-300"
            >
              <button
                className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-300"
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
              >
                <span
                  className="text-lg font-semibold pr-8"
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    color: "#0E0E0E",
                  }}
                >
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${
                    openFaq === index ? "rotate-180" : ""
                  }`}
                />
              </button>

              {openFaq === index && (
                <div className="px-8 pb-6">
                  <p
                    className="text-gray-600 leading-relaxed"
                    style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                  >
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="text-center mt-12">
          <p
            className="text-gray-600 mb-4"
            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
          >
            Still have questions?
          </p>
          <button
            className="text-gray-900 font-semibold hover:underline"
            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
          >
            Contact our support team →
          </button>
        </div>
      </div>
    </section>
  );
};

// CTA Section
const CTASection = () => {
  return (
    <section className="px-8 py-20 bg-gray-900">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-full border border-gray-700 mb-8">
            <Sparkles className="w-4 h-4 text-white" />
            <span
              className="text-sm font-semibold tracking-wide text-white"
              style={{ fontFamily: "Inter, system-ui, sans-serif" }}
            >
              GET STARTED TODAY
            </span>
          </div>

          <h2
            className="text-5xl font-black mb-6 text-white"
            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
          >
            Ready to transform your
            <br />
            <span className="text-gray-300">workspace?</span>
          </h2>

          <p
            className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto"
            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
          >
            Join thousands of teams who have already revolutionized their
            workflow with NexusOne. Start your free trial today.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            className="group relative px-8 py-4 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-all duration-300 overflow-hidden"
            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
          >
            <span className="relative z-10 flex items-center gap-2">
              Start Free Trial
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>

          <button
            className="group relative px-8 py-4 border-2 border-gray-600 text-white font-semibold rounded-xl hover:border-gray-400 hover:bg-gray-800 transition-all duration-300"
            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
          >
            <span className="flex items-center gap-2">
              Schedule Demo
              <Calendar className="w-4 h-4" />
            </span>
          </button>
        </div>

        <div className="flex items-center justify-center gap-6 mt-12 pt-8 border-t border-gray-700">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <CheckCircle className="w-4 h-4 text-gray-300" />
            <span style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
              14-day free trial
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <CheckCircle className="w-4 h-4 text-gray-300" />
            <span style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
              No credit card required
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <CheckCircle className="w-4 h-4 text-gray-300" />
            <span style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
              Cancel anytime
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Home;
