"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { useDispatch } from "react-redux";
import { setFilters } from "@/state";
import { useRouter } from "next/navigation";

const HeroSection = () => {
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleLocationSearch = async () => {
    try {
      const trimmedQuery = searchQuery.trim();
      if (!trimmedQuery) return;

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          trimmedQuery
        )}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}&fuzzyMatch=true`
      );

      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        dispatch(
          setFilters({
            location: trimmedQuery,
            coordinates: [lat, lng],
          })
        );
        const params = new URLSearchParams({
          location: trimmedQuery,
          lat: lat.toString(),
          lng: lng,
        });
        router.push(`/search?${params.toString()}`);
      }
    } catch (error) {
      console.error("error search location:", error);
    }
  }; 
  return (
    <div className="relative h-screen">
      <Image
        src="/landing-splash.jpg"
        alt="HR plentiful Rental Platform Hero Section "
        className="object-cover object-center"
        fill
        priority
      />
      <div className="absolute inset-0 bg-black bg-opacity-60"></div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="absolute top-1/3 transform -translate-x-1/2 -translate-y-1/2 text-center w-full"
      >
        <div className="max-w-4xl mx-auto px-16 sm:px-12">
          <h1 className="text-5xl font-bold text-white mb-4 ">
            Start your journey to finding the perfect place to call home
          </h1>

          <p className="text-xl text-white mb-8">
            Explore our wide range of rental properties tailored to suit your
            lifestyle and needs!
          </p>

          <div className="flex justify-center">
            <Input
              type="text"
              value={searchQuery}
              placeholder="Search by city, neighbourhood or address"
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full max-w-lg rounded-none rounded-l-xl border-none bg-white h-12"
            />
            <Button
              onClick={() => handleLocationSearch()}
              className="bg-secondary-500 text-white rounded-none rounded-r-xl h-12 border-none hover:bg-secondary-600"
            >
              Search
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default HeroSection;
