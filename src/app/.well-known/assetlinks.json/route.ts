import { NextResponse } from "next/server";

// Digital Asset Links manifest for the GreenSori Map TWA (com.greensori.map).
// Served via a Route Handler instead of a static file under public/.well-known/
// because Vercel's static asset pipeline was not serving the dotfile-prefixed
// path (public/.well-known/assetlinks.json returned 404 in production even
// though the file exists and other public/ assets serve fine).
const ASSET_LINKS = [
  {
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: "com.greensori.map",
      sha256_cert_fingerprints: [
        "36:50:4D:D2:97:7A:C9:B3:30:18:FD:6F:17:EF:CD:18:EE:9F:5A:2F:90:FD:92:AE:8D:79:94:94:57:4F:27:E7",
      ],
    },
  },
];

export function GET() {
  return NextResponse.json(ASSET_LINKS);
}
