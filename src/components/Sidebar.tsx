import { Link, useLocation } from "react-router-dom";
// import { useAuth } from "@/context/AuthContext";
import { Button } from "./ui/button";
import { Users } from "lucide-react";

const Sidebar = () => {
    const location = useLocation();
    // const { logout } = useAuth();

    const links = [
        { name: "Access Control", path: "/dashboard/access" },
        { name: "Users", path: "/dashboard/users" },
        { name: "Logs", path: "/dashboard/logs" },
    ];

    return (
        <aside className="w-64 min-h-screen p-5 text-white bg-gray-900">
            <h1 className="mb-6 text-2xl font-bold">Trackar</h1>
            <nav className="h-[85%] flex flex-col justify-between w-full">
                <div className="space-y-2">
                    {links.map(link => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`block px-4 py-2 rounded-lg transition ${location.pathname === link.path
                                ? "bg-gray-700 font-semibold"
                                : "hover:bg-gray-800"
                                }`}
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>

                {/* <div className="flex w-full gap-2">
                    <Link to="/welcome" className="w-full sm:w-auto">
                        <Button
                            variant="outline"
                            className="flex items-center justify-center w-full text-black sm:w-auto border-grey-300 hover:bg-grey-50 hover:text-primary-500"
                        >
                            <Users className="w-4 h-4 mr-[1px]" />
                            <span className="text-xs">Interfacee</span>
                        </Button>
                    </Link>

                    <Button
                        onClick={logout}
                        variant="outline"
                        className="flex items-center justify-center w-full mt-auto text-black sm:w-auto border-grey-300 hover:bg-grey-50 hover:text-primary-500"
                    >
                        <LogOutIcon className="w-4 h-4 mr-[1px]" />
                        <span className="text-xs">Logout</span>
                    </Button>
                </div> */}

                <Link to="/welcome" className="w-full sm:w-full">
                    <Button
                        variant="outline"
                        className="flex items-center justify-center w-full text-black border-grey-300 hover:bg-grey-50 hover:text-primary-500"
                    >
                        <Users className="w-4 h-4 mr-[1px]" />
                        <span className="text-xs">Interfacee</span>
                    </Button>
                </Link>
            </nav>

            <div>

            </div>
        </aside>
    );
};

export default Sidebar;
