import Sidebar from "@/components/Sidebar";

export default function Home() {
  return (
    <div className="flex">
      <Sidebar activePage="Dashboard" />
      <div className="flex-1 p-8">
        <h1 className="text-2xl font-bold">Main content goes here</h1>
      </div>
    </div>
  );
}