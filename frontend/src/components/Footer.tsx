import React from 'react';
import { Linkedin } from 'lucide-react';

const Footer: React.FC = () => {
    return (
        <footer className="py-6 text-center text-sm text-gray-500 border-t mt-auto">
            <div className="flex flex-col items-center justify-center gap-2">
                <p>&copy; {new Date().getFullYear()} SwaSarwam. All rights reserved.</p>
                <a
                    href="https://www.linkedin.com/in/manish-kumar-linked"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors font-medium"
                >
                    <Linkedin className="h-4 w-4" />
                    Contact the Developer
                </a>
            </div>
        </footer>
    );
};

export default Footer;
