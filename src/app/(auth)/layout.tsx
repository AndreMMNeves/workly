export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid place-items-center p-4 bg-background">
      {children}
    </div>
  );
}
