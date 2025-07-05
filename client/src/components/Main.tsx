import { useEffect, useRef, useState } from 'react'
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  TransitionChild,
} from '@headlessui/react'
import {
  Bars3Icon,
  EllipsisVerticalIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { v7 as uuidv7 } from 'uuid';
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import iconLogo from "../assets/Lovelace_Icon.png"
// import { getAuthToken, getUserSession, supabase } from '../lib/supabase'
import { Link, useNavigate } from 'react-router'
import { useParams } from "react-router"
import Chat from './Chat'
import CreateNewChat from './CreateNewChat'
// import { Session } from '@supabase/supabase-js'

const API_URL = "http://localhost:3000" || import.meta.env.VITE_BASE_URL;

export default function Main() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [chats, setChats] = useState<string[]>([]);
  const [chatId, setChatId] = useState("");
  // const [session, setSession] = useState<Session | null>(null)

  const params = useParams();
  const navigate = useNavigate();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef: any = useRef(null);

  // Close the menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: any) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleMenu = (id: string, e: any) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const handleDelete = async (id: string, e: any) => {
    e.preventDefault();
    e.stopPropagation();
    const token = ""//await getAuthToken();
    const headers: any = {
      'Content-Type': 'application/json', 
      'hunter-token': token
    }
    await fetch(`${API_URL}/chat/${id}`, {
      method: "DELETE", 
      headers
    })

    await loadChats();
    setOpenMenuId(null);
    if(id === chatId) {
      navigate("/");
    }
  };

  useEffect(() => {
    setChatId(params.id || "");

    loadChats();
  }, [params.id])

  const loadChats = async () => {
    // const userSession = await getUserSession();
    // setSession(userSession.data.session);
    const accessToken = ""//await getAuthToken();
    const headers: any = {
      'hunter-token': accessToken
    }
    const res = await fetch(`${API_URL}/chat`, {
      headers: headers
    });

    const data = await res.json();
    console.log({ data })
    const chatsForUser = data.data;
    setChats(chatsForUser);
  }

  const handleSignOut = async () => {
    // await supabase.auth.signOut();
  }

  const createNewChat = async () => {
    const uuid = uuidv7();
    // const token = await getAuthToken();
    const headers: any = {
      'Content-Type': 'application/json',
      // 'hunter-token': token
    }
    await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        chatId: uuid
      })
    })

    navigate(`/${uuid}`);
  }

  return (
    <>
      <div>
        <Dialog open={sidebarOpen} onClose={setSidebarOpen} className="relative z-50">
          <DialogBackdrop
            transition
            className="max-w-[200px] border-r border-gray-300 fixed inset-0 bg-bg transition-opacity duration-300 ease-linear data-[closed]:opacity-0"
          />

          <div className="max-w-[200px] fixed inset-0 flex">
            <DialogPanel
              transition
              className="relative mr-16 flex max-w-[200px] flex-1 transform transition duration-300 ease-in-out data-[closed]:-translate-x-full"
            >
              <TransitionChild>
                <div className="w-full justify-end absolute top-0 flex w-16 justify-center pt-5 duration-300 ease-in-out data-[closed]:opacity-0">
                  <button type="button" onClick={() => setSidebarOpen(false)} className="-m-2.5 p-2.5 cursor-pointer">
                    <span className="sr-only">Close sidebar</span>
                    <XMarkIcon aria-hidden="true" className="size-6 text-lovelace" />
                  </button>
                </div>
              </TransitionChild>
              {/* Sidebar component, swap this element with another sidebar if you like */}
              <div className="flex grow flex-col gap-y-5 overflow-y-auto px-6 pb-4">
                <div className="flex h-16 shrink-0 items-center">
                  <img
                    alt="Lovelace"
                    src={iconLogo}
                    className="h-8 w-auto"
                  />
                </div>
                <nav className="flex flex-1 flex-col">
                  <button
                    onClick={createNewChat}
                    className="cursor-pointer bg-gold text-lovelace rounded-md px-4 py-2 text-xs mb-2"
                  >
                    New chat
                  </button>
                  <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                      <span className="text-gold text-xs">Recent chats</span>
                      <ul role="list" className="-mx-2 space-y-1">
                        {chats.map((chat) => (
                          <li className="flex items-center w-full" key={chat}>
                            <Link
                              to={`/${chat}`}
                              className="text-lovelace hover:bg-gold hover:text-white group flex flex-1 rounded-md p-2 text-sm/6 font-semibold overflow-hidden"
                            >
                              <div className="truncate w-full">{chat}</div>
                            </Link>
                            <div className="relative" ref={openMenuId === chat ? menuRef : null}>
                              <button
                                onClick={(e) => toggleMenu(chat, e)}
                                className="p-1 rounded-full hover:bg-gray-200 text-gray-600"
                              >
                                <EllipsisVerticalIcon className="h-5 w-5" />
                              </button>

                              {openMenuId === chat && (
                                <div className="absolute right-0 z-10 mt-1 w-36 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                  <div className="py-1">
                                    <button
                                      onClick={(e) => handleDelete(chat, e)}
                                      className="text-red-600 group flex w-full items-center px-4 py-2 text-sm hover:bg-gray-100"
                                    >
                                      <TrashIcon className="mr-3 h-5 w-5" />
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </li>
                  </ul>
                </nav>
              </div>
            </DialogPanel>
          </div>
        </Dialog>


        <div className="">
          <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 sm:gap-x-6 sm:px-6 lg:px-8">
            <button type="button" onClick={() => setSidebarOpen(true)} className="-m-2.5 p-2.5 text-gray-700 cursor-pointer">
              <span className="sr-only">Open sidebar</span>
              <Bars3Icon aria-hidden="true" className="size-6" />
            </button>

            <div className="flex flex-1 gap-x-4 self-stretch justify-end">
              <div className="flex items-center gap-x-4">
                {/* Profile dropdown */}
                <Menu as="div" className="relative">
                  <MenuButton className="-m-1.5 flex items-center p-1.5">
                    <span className="sr-only">Open user menu</span>
                    {/* {
                      session &&
                      <img
                        alt=""
                        src={session.user.user_metadata.avatar_url}
                        className="size-8 rounded-full bg-gray-50"
                      />
                    } */}
                    <span className="hidden lg:flex lg:items-center">
                      <ChevronDownIcon aria-hidden="true" className="ml-2 size-5 text-gray-400" />
                    </span>
                  </MenuButton>
                  <MenuItems
                    transition
                    className="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
                  >
                    <MenuItem >
                      <button
                        onClick={handleSignOut}
                        className="block px-3 py-1 text-sm/6 text-gray-900 data-[focus]:bg-gray-50 data-[focus]:outline-none"
                      >
                        Sign out
                      </button>
                    </MenuItem>
                  </MenuItems>
                </Menu>
              </div>
            </div>
          </div>

          <main className="py-10">
            <div className="px-4 sm:px-6 lg:px-8">{
              chatId ?
                <Chat /> :
                <CreateNewChat />
            }</div>
          </main>
        </div>
      </div>
    </>
  )
}
