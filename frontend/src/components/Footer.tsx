export default function Footer() {
  return (
    <footer className="bg-gray-800/90 backdrop-blur border-t border-gray-700 text-white py-8">
      <div className="container mx-auto px-4 text-center">
        <p>© {new Date().getFullYear()} Паук: Мегаселлер</p>
      </div>
    </footer>
  );
}