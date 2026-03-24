import React from 'react'
import Image from 'next/image'
const Logo = () => {
  return (
<div className="relative w-24 sm:w-28 md:w-32 lg:w-40 aspect-square">
  <Image
    src="/images/logo12.png"
    alt="Logo"
    fill
    className="object-contain"
  />
</div>
  )
}

export default Logo
