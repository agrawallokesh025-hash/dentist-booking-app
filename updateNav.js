const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'site', 'public');
const files = fs.readdirSync(publicDir).filter(file => file.endsWith('.html'));

const searchString = `<a href="contact.html" class="text-secondary hover:text-primary-gold transition">Contact</a>
                    <a href="booking.html" class="btn-primary ml-4 shadow-md">Book Now</a>`;

// Normalize whitespace to make matching easier
const searchRegex = /<a\s+href="contact\.html"[^>]*>Contact<\/a>\s*<a\s+href="booking\.html"\s+class="btn-primary[^>]*>Book Now<\/a>/;

const replacement = `<a href="contact.html" class="text-secondary hover:text-primary-gold transition">Contact</a>
                    
                    <!-- Login Dropdown -->
                    <div class="relative group ml-4">
                        <button class="text-secondary hover:text-primary-gold transition font-medium flex items-center gap-1 py-2">
                            Login <i class="fa-solid fa-chevron-down text-xs transition-transform group-hover:rotate-180"></i>
                        </button>
                        <!-- Invisible bridge to keep hover active when moving cursor down -->
                        <div class="absolute w-full h-4 bottom-[-10px] left-0"></div>
                        <div class="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 overflow-hidden transform origin-top-right group-hover:translate-y-0 translate-y-2">
                            <a href="patient-portal.html" class="px-4 py-3 text-sm text-secondary hover:bg-light hover:text-primary-gold border-b border-gray-50 flex items-center gap-3 transition-colors">
                                <i class="fa-solid fa-mobile-screen text-primary-gold w-4 text-center"></i> Patient (OTP)
                            </a>
                            <a href="admin.html" class="px-4 py-3 text-sm text-secondary hover:bg-light hover:text-primary-gold flex items-center gap-3 transition-colors">
                                <i class="fa-solid fa-user-shield text-primary-gold w-4 text-center"></i> Admin Login
                            </a>
                        </div>
                    </div>

                    <a href="booking.html" class="btn-primary ml-4 shadow-md">Book Now</a>`;

let updatedCount = 0;

files.forEach(file => {
    const filePath = path.join(publicDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (searchRegex.test(content)) {
        content = content.replace(searchRegex, replacement);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${file}`);
        updatedCount++;
    } else {
        console.log(`Pattern not found in ${file} (might already be updated or missing nav)`);
    }
});

console.log(`Total files updated: ${updatedCount}`);
