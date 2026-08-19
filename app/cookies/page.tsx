export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-900/40 to-transparent py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 sm:p-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-8">Cookie Policy</h1>
          
          <div className="space-y-8 text-green-50">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">What Are Cookies?</h2>
              <p className="leading-relaxed">
                Cookies are small text files that are placed on your device when you visit our website. They help us understand how you use our site and allow us to remember your preferences.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">How We Use Cookies</h2>
              <p className="mb-4 leading-relaxed">
                We use cookies to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Help our website operate securely and reliably</li>
                <li>Improve system efficiency and performance</li>
                <li>Support marketing activities and personalization</li>
                <li>Remember your preferences and login information</li>
                <li>Analyze how you use our website to improve services</li>
                <li>Provide targeted content and advertisements</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Types of Cookies We Use</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-lime-300 mb-2">Essential Cookies</h3>
                  <p>Required for the website to function properly. These cannot be disabled.</p>
                </div>
                
                <div>
                  <h3 className="font-bold text-lime-300 mb-2">Performance Cookies</h3>
                  <p>Help us understand how visitors use our website, allowing us to improve performance and functionality.</p>
                </div>
                
                <div>
                  <h3 className="font-bold text-lime-300 mb-2">Marketing Cookies</h3>
                  <p>Used to track your activity and show relevant advertisements across the web.</p>
                </div>
                
                <div>
                  <h3 className="font-bold text-lime-300 mb-2">Preference Cookies</h3>
                  <p>Remember your preferences and settings to enhance your experience on future visits.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Your Cookie Choices</h2>
              <p className="mb-4 leading-relaxed">
                You can control cookies through your browser settings. Most browsers allow you to refuse cookies or alert you when cookies are being sent. However, blocking cookies may affect the functionality of our website.
              </p>
              <p className="leading-relaxed">
                To learn more about controlling cookies, visit:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                <li><a href="https://allaboutcookies.org" target="_blank" rel="noopener noreferrer" className="text-lime-300 hover:text-lime-400 underline">All About Cookies</a></li>
                <li><a href="https://www.youronlinechoices.com" target="_blank" rel="noopener noreferrer" className="text-lime-300 hover:text-lime-400 underline">Your Online Choices</a></li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Contact Us</h2>
              <p className="leading-relaxed">
                If you have any questions about our Cookie Policy, please contact us at:
              </p>
              <p className="mt-4 text-lime-300">
                Email: privacy@realestate.ph<br />
                Address: Manila, Philippines
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Policy Updates</h2>
              <p className="leading-relaxed">
                This Cookie Policy was last updated in 2026. We may update this policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
