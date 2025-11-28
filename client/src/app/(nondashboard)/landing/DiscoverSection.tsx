"use client";

import React from "react";
import { motion } from "framer-motion";
import FeatureCard from "./FeatureCard";
import Image from "next/image";
import DiscoverCard from "./DiscoverCard";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
  },
};

const DiscoverSection = () => {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.8 }}
      className="py-12 bg-white mb-16"
    >
      <div className="max-w-6xl xl:max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
        <motion.div variants={itemVariants} className="my-12 text-center">
          <h2 className="text-3xl font-semibold leading-tight text-gray-300">
            Discover
          </h2>
          <p className="text-gray-600 mt-4 text-lg">
            Find your dream rental property today!
          </p>
          <p className="text-gray-500 mt-2 max-w-3xl mx-auto">
            Streamline your apartment hunting with our powerful search tools
            designed to help you find the perfect home quickly and easily. Our
            advanced filters and smart recommendations make finding your ideal
            rental effortless.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 xl:gap-16 text-center">
          {[
            {
              imageSrc: "/landing-icon-wand.png",
              title: "Search for properties",
              description: "Find properties in your surrounding area",
            },
            {
              imageSrc: "/landing-icon-calendar.png",
              title: "Book your rental",
              description: "Secure your perfect home with ease",
            },
            {
              imageSrc: "/landing-icon-heart.png",
              title: "Enjoy your new home",
              description: "Settle into your new home with confidence",
            },
          ].map((card, index) => (
            <motion.div key={index} initial={itemVariants}>
              <DiscoverCard {...card} />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default DiscoverSection;
