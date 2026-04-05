'use client';

import React from 'react';

import { Button } from '@/app/ui/button';
import { useRouter } from "next/navigation";


import {
  Video,
  Laptop,
  Users,
  GraduationCap,
  Rocket,
  Headphones,
  Calendar,
  CreditCard,
  BarChart3,
  Globe,
  Zap,
  Shield,
  CheckCircle,
  ArrowRight,
  Star,
  Smartphone,
  Clock
} from 'lucide-react';

import PublicFooter from "@/components/layout/PublicFooter";

import Link from 'next/link';
import { useApp } from '../../contexts/AppContext';

export function LandingHome() {
  const { t, isRTL } = useApp();


const features = [
  { icon: Calendar, title: t("feature.booking"), desc: t("feature.booking.desc"), color: "from-primary to-primary/80" },
  { icon: Users, title: t("feature.providers"), desc: t("feature.providers.desc"), color: "from-primary to-primary/80" },
  { icon: CreditCard, title: t("feature.payments"), desc: t("feature.payments.desc"), color: "from-primary to-primary/80" },
  { icon: Globe, title: t("feature.website"), desc: t("feature.website.desc"), color: "from-primary to-primary/80" },
  { icon: BarChart3, title: t("feature.analytics"), desc: t("feature.analytics.desc"), color: "from-primary to-primary/80" },
  { icon: Smartphone, title: t("feature.apps"), desc: t("feature.apps.desc"), color: "from-primary to-primary/80" }
];


const stats = [
  { value: "10,000+", label: t("landing.stats.businesses") },
  { value: "500K+", label: t("landing.stats.bookings") },
  { value: "99.9%", label: t("landing.stats.uptime") },
  { value: "24/7", label: t("landing.stats.support") }
];

const useCases = [
  { icon: Video, title: t("usecase.beauty"), desc: t("usecase.beauty.desc") },
  { icon: Headphones, title: t("usecase.health"), desc: t("usecase.health.desc") },
  { icon: Laptop, title: t("usecase.home"), desc: t("usecase.home.desc") },
  { icon: Users, title: t("usecase.fitness"), desc: t("usecase.fitness.desc") },
  { icon: GraduationCap, title: t("usecase.education"), desc: t("usecase.education.desc") },
  { icon: Rocket, title: t("usecase.auto"), desc: t("usecase.auto.desc") }
];

const testimonials = [
  {
    name: 'Sarah Johnson',
    business: 'Elegant Spa & Salon',
    rating: 5,
    text: 'BookingPro transformed our business. We increased bookings by 60% in just 3 months!',
    avatar: '👩‍💼'
  },
  {
    name: 'Ahmed Al-Rashid',
    business: 'Home Services Pro',
    rating: 5,
    text: 'The marketplace feature brought us 200+ new customers. Amazing platform!',
    avatar: '👨‍💼'
  },
  {
    name: 'Maria Garcia',
    business: 'Wellness Studio',
    rating: 5,
    text: 'Easy to use, powerful features, and excellent support. Highly recommended!',
    avatar: '👩'
  },
];


return (
  <div className="bg-white">

    {/* Hero Section */}
    <section className="relative overflow-hidden bg-gradient-to-br from-accent via-background to-secondary">
      <div className="container mx-auto max-w-7xl px-6 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* LEFT */}
          <div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full
  bg-accent text-primary border border-primary/20">

              <Zap className="w-4 h-4" />
              <span className="text-sm font-medium">{t("landing.badge")}</span>
            </div>

            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              {t("landing.title")}
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              {t("landing.subtitle")}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Button
              size="lg"
              asChild
              className="bg-primary hover:bg-primary/90 text-primary-foreground
                        text-lg px-8 rounded-xl shadow-lg shadow-primary/20"
              >

                <Link href="/signup">
                  {t("landing.startTrial")}
                  <ArrowRight className={`w-5 h-5 ml-2 ${isRTL ? "rotate-180" : ""}`} />
                </Link>
              </Button>

              <Button
                size="lg"
                variant="outline"
                asChild
                className="text-lg px-8 rounded-xl border-2"
              >
                <Link href="/features">{t("landing.viewDemo")}</Link>
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <span className="text-sm text-gray-600">{t("landing.uptime")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary
                " />
                <span className="text-sm text-gray-600">{t("landing.support")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary/80" />
                <span className="text-sm text-gray-600">{t("landing.countries")}</span>
              </div>
            </div>
          </div>

          {/* RIGHT - Hero Mockup */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-8 border-white">
              <div className="bg-gradient-to-br from-primary to-primary/80 aspect-[4/3] flex items-center justify-center p-8">
                <div className="text-white text-center">
                  <Calendar className="w-24 h-24 mx-auto mb-4 opacity-90" />
                  <p className="text-2xl font-semibold">{t("landing.viewDemo")}</p>
                </div>
              </div>
            </div>

            {/* Floating Card */}
            <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-xl p-4 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">+60%</div>
                  <div className="text-sm text-gray-600">{t("landing.stats.bookings")}</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>


    {/* Stats */}
    <section className="py-16 bg-white border-y border-gray-200">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>


    {/* Features */}
    <section className="py-20 bg-gradient-to-br from-secondary to-accent">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4">
            {t("landing.features.title")}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t("landing.features.subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group p-8 rounded-2xl bg-background
                border border-border
                hover:border-primary/40 hover:shadow-xl transition-all"

              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>


    {/* Use Cases */}
    <section className="py-20 bg-white">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4">
            {t("landing.usecases.title")}
          </h2>
          <p className="text-xl text-gray-600">
            {t("landing.usecases.subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon;

            return (
              <div
                key={index}
                className="p-6 rounded-xl bg-gradient-to-br from-gray-50 to-white
                          border border-gray-200 hover:border-primary/40
                          hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="mb-4">
                  <Icon className="w-10 h-10 text-primary" />
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {useCase.title}
                </h3>

                <p className="text-gray-600 text-sm">
                  {useCase.desc}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>


    {/* Testimonials */}
    <section className="py-20 bg-gradient-to-br from-primary to-primary/80">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4">
            {t("landing.testimonials.title")}
          </h2>
          <p className="text-xl text-primary-foreground/80">{t("landing.testimonials.subtitle")}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="p-8 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-white mb-6 leading-relaxed">
                &quot;{testimonial.text}&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold text-white">{testimonial.name}</div>
                  <div className="text-sm text-primary-foreground/70">{testimonial.business}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>


    {/* CTA */}
    <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="container mx-auto max-w-4xl px-6 text-center">
        <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
          {t("landing.cta.title")}
        </h2>
        <p className="text-xl text-gray-300 mb-8">
          {t("landing.cta.subtitle")}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-lg px-8 rounded-xl">
            <Link href="/signup">
              {t("landing.cta.getStarted")}
              <ArrowRight className={`w-5 h-5 ml-2 ${isRTL ? "rotate-180" : ""}`} />
            </Link>
          </Button>

          <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-lg px-8 rounded-xl">
            <Link href="/contact">{t("landing.cta.contact")}</Link>
          </Button>
        </div>
      </div>
    </section>


    {/* Footer */}
    <PublicFooter/>

  </div>
);
}
