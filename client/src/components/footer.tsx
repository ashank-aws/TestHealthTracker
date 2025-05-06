import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-white shadow-md mt-auto">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-gray-600">
            &copy; {new Date().getFullYear()} Test Environment Manager. All rights reserved.
          </div>
          <div className="mt-2 md:mt-0 flex items-center space-x-4">
            <Link href="#" className="text-sm text-gray-600 hover:text-primary">
              Documentation
            </Link>
            <Link href="#" className="text-sm text-gray-600 hover:text-primary">
              Support
            </Link>
            <Link href="#" className="text-sm text-gray-600 hover:text-primary">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
