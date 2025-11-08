"use client"
import { Facebook, Twitter, Youtube } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-[#0b0f10] border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
              <span className="text-red-500 font-extrabold">P</span>
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-tight">PlayLive7</p>
              <p className="text-white/50 text-sm leading-tight">Play & win daily</p>
            </div>
          </div>

          {/* Social links */}
          <div className="flex items-center gap-4">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <Facebook className="w-5 h-5" />
              <span>Facebook</span>
            </a>
            <span className="h-5 w-px bg-white/20" />
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <Twitter className="w-5 h-5" />
              <span>Twitter</span>
            </a>
            <span className="h-5 w-px bg-white/20" />
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <Youtube className="w-5 h-5" />
              <span>YouTube</span>
            </a>
          </div>

          {/* Copy */}
          <div className="text-white/70 text-sm leading-relaxed">
            <p>Best experienced on the latest versions of Chrome and Firefox.</p>
            <p className="mt-1">© {new Date().getFullYear()} JORI95. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  )}


