import { Link } from "react-router-dom";
import { Phone, Globe, MapPin } from "lucide-react";
import { CONTACT } from "../data/siteContent";

export default function Footer() {
  return (
    <footer className="bg-forest text-white">
      <div className="container-x py-14">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-lime text-forest font-display">
                E
              </span>
              <span className="font-display text-xl">{CONTACT.brand}</span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-white/70">
              Private tennis lessons for kids & adults across the Kansas City
              metro. Fundamentals first, confidence always.
            </p>
          </div>

          <div className="text-sm">
            <h4 className="mb-4 font-display text-lime">Get in touch</h4>
            <ul className="space-y-3 text-white/80">
              <li>
                <a
                  href={CONTACT.phoneHref}
                  className="flex items-center gap-3 hover:text-lime"
                >
                  <Phone size={16} /> {CONTACT.phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Globe size={16} /> {CONTACT.website}
              </li>
              <li className="flex items-center gap-3">
                <MapPin size={16} /> {CONTACT.location}
              </li>
            </ul>
          </div>

          <div className="text-sm">
            <h4 className="mb-4 font-display text-lime">Explore</h4>
            <ul className="space-y-3 text-white/80">
              <li>
                <a href="/#about" className="hover:text-lime">
                  About Coach Eli
                </a>
              </li>
              <li>
                <a href="/#pricing" className="hover:text-lime">
                  Pricing
                </a>
              </li>
              <li>
                <Link to="/book" className="hover:text-lime">
                  Book a Session
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-lime">
                  Owner Login
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {CONTACT.brand}. All rights reserved.
          </p>
          <p>Built by Adrian Bartholomew</p>
        </div>
      </div>
    </footer>
  );
}
