"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

interface DiscoverCardProps {
  imageSrc: string;
  title: string;
  description: string;
}

const DiscoverCard = ({
  imageSrc,
  title,
  description
}: DiscoverCardProps) => {
  return (
    <div className="px-4 py-12 shadow-lg rounded-lg bg-primary-50 md-h-72">
      <div className="bg-primary-700 p-[0.6rem] rounded-full mb-4 h-10 w-10 mx-auto">
        <Image
          src={imageSrc}
          alt={title}
          width={30}
          height={30}
          className="w-full h-full"
        />
      </div>

      <h3 className="mt-4 text-xl font-medium text-gray-800">{title}</h3>
      <p className="mb-2 text-base text-gray-500">{description}</p>
    </div>
  );
};

export default DiscoverCard;
