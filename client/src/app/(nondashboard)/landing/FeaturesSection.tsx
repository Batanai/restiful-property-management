"use client";

import React from "react";
import { motion } from "framer-motion";
import FeatureCard from "./FeatureCard";

const containerVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.2,
      duration: 0.5,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5 },
  },
};

const FeaturesSection = () => {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="py-24 px-6 sm:px-8 lg:px-12 xl:px-16 bg-white"
    >
      <div className="max-w-4xl xl:max-w-6xl mx-auto">
        <motion.h2
          variants={itemVariants}
          className="text-3xl font-bold text-center mb-12 w-full sm:w-2/3 mx-auto"
        >
          Quickly find the home you want using our advanced search filters!
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 xl:gap-16">
          {[0, 1, 2].map((item) => (
            <motion.div key={item} variants={itemVariants}>
              <FeatureCard
                imageSrc={`/landing-search${3 - item}.png`}
                title={
                  [
                    "Trustworthy and verified listings",
                    "Browse rental listings with ease",
                    "Simplify your rental search with advanced",
                  ][item]
                }
                description={
                  [
                    "Find reliable and vetted rental properties with confidence.",
                    "Easily browse through a wide variety of rental listings.",
                    "Streamline your apartment hunting with our advanced search tools.",
                  ][item]
                }
                linkText={["Explore", "Search", "Discover"][item]}
                linkHref={["/explore", "/search", "/discover"][item]}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default FeaturesSection;
