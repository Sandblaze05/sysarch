import React from 'react'
import { User2Icon } from 'lucide-react'

const NavProfile = () => {
  return (
    <div className='h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center border-2 border-white/20 bg-[#171717]/50 backdrop-blur-md rounded-full mt-5'>
      <User2Icon />
    </div>
  )
}

export default NavProfile