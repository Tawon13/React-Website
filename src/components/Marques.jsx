import React from "react";
import Slider from "react-slick";
import { assets } from "../assets/assets";

const Marques = () => {
  const logos = [
    assets.appointment_img, // Remplacez par les chemins de vos logos
    assets.appointment_img,
    assets.appointment_img,
    assets.appointment_img,
    assets.appointment_img,
    assets.appointment_img,
  ];

  const settings = {
    dots: false,
    infinite: true,
    speed: 3000, // Augmenter légèrement la vitesse
    slidesToShow: 6,
    slidesToScroll: 1, // Défiler un élément très lentement pour réduire le "roll-back"
    autoplay: true,
    autoplaySpeed: 0, // Autoplay continu
    cssEase: "linear",
    arrows: false, // Désactiver les flèches
  };

  return (
    <div className="mt-10"> {/* Utilisation de mt-10 pour espacer du header */}
      <h2 className="text-black text-2xl font-bold mb-6 text-center">
        Nos partenaires
      </h2>
      <div className="bg-primary rounded-lg p-6">
        <Slider {...settings}>
          {logos.map((logo, index) => (
            <div key={index} className="flex items-center justify-center px-4">
              <img
                src={logo}
                alt={`Logo ${index + 1}`}
                className="max-h-20 object-contain md:max-h-16 lg:max-h-20 sm:max-h-12"
              />
            </div>
          ))}
        </Slider>
      </div>
    </div>
  );
};

export default Marques;
