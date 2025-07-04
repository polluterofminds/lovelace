import { v7 as uuidv7 } from 'uuid';
import { getAuthToken } from '../lib/supabase';
import { useNavigate } from "react-router";

const CreateNewChat = () => {
  const navigate = useNavigate();

  const createNewChat = async () => {
    const uuid = uuidv7();
    const token = await getAuthToken();
    const headers: any = {
      'Content-Type': 'application/json', 
      'hunter-token': token
    }
    await fetch(`${import.meta.env.VITE_BASE_URL}/chat`, {
      method: "POST",
      headers, 
      body: JSON.stringify({
        chatId: uuid
      })
    })

    navigate(`/${uuid}`);
  }
  return (
    <div className="min-h-[65vh] w-screen flex flex-col justify-center items-center">
      <h1 className="text-xl text-lovelace">What do you want to chat about?</h1>
      <button onClick={createNewChat} className="cursor-pointer mt-4 bg-gold text-lovelace px-4 py-2 rounded-md">Start new chat</button>
    </div>
  )
}

export default CreateNewChat