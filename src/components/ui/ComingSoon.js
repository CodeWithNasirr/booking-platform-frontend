// app/components/ComingSoon.jsx

export default function ComingSoon({ title = "Coming Soon" }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black text-white px-6">
      <div className="text-center max-w-xl">
        
        {/* Badge */}
        <div className="inline-block px-4 py-1 mb-4 text-sm bg-white/10 rounded-full">
          🚀 Under Development
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          {title}
        </h1>

        {/* Subtitle */}
        <p className="text-gray-400 mb-6">
          We're working hard to bring this feature to life. Stay tuned!
        </p>

        {/* Loader */}
        <div className="flex justify-center mb-6">
          <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
        </div>

        {/* Button */}
        <a
          href="/"
          className="inline-block bg-white text-black px-6 py-2 rounded-lg font-medium hover:bg-gray-200 transition"
        >
          Go Back Home
        </a>

      </div>
    </div>
  );
}