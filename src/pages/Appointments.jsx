import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { assets } from "../assets/assets";

const Appointments = () => {
  const { docId } = useParams();
  const { doctors, currencySymbol } = useContext(AppContext);
  const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  const [docInfo, setDocInfo] = useState(null);
  const [docSlots, setDocSlots] = useState([]);
  const [selectedDay, setSelectedDay] = useState(0);

  // Récupérer les informations du médecin
  const fetchDocInfo = () => {
    if (doctors && doctors.length > 0) {
      const info = doctors.find((doc) => String(doc._id) === docId);
      setDocInfo(info || null);
    }
  };

  // Générer les créneaux horaires disponibles
  const generateAvailableSlots = () => {
    const slots = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);

      const endTime = new Date(currentDate);
      endTime.setHours(21, 0, 0, 0);

      if (i === 0) {
        currentDate.setHours(Math.max(currentDate.getHours() + 1, 10));
        currentDate.setMinutes(currentDate.getMinutes() > 30 ? 30 : 0);
      } else {
        currentDate.setHours(10);
        currentDate.setMinutes(0);
      }

      const dailySlots = [];
      while (currentDate < endTime) {
        const formattedTime = currentDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        dailySlots.push({
          dateTime: new Date(currentDate),
          time: formattedTime,
        });

        currentDate.setMinutes(currentDate.getMinutes() + 30);
      }
      slots.push({
        date: `${daysOfWeek[currentDate.getDay()]} ${currentDate.getDate()}`,
        slots: dailySlots,
      });
    }

    setDocSlots(slots);
  };

  // Effets pour gérer les données
  useEffect(() => {
    fetchDocInfo();
  }, [doctors, docId]);

  useEffect(() => {
    if (docInfo) {
      generateAvailableSlots();
    }
  }, [docInfo]);

  if (!docInfo) {
    return <div>Loading doctor information...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Informations sur le médecin */}
        <div>
          <img
            className="bg-primary w-full sm:max-w-[18rem] rounded-lg"
            src={docInfo.image}
            alt={docInfo.name}
          />
        </div>
        <div className="flex-1 border border-gray-400 rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0">
          <p className="flex items-center gap-2 text-2xl font-medium text-gray-900">
            {docInfo.name}
            <img className="w-5" src={assets.verified_icon} alt="Verified" />
          </p>
          <div className="flex items-center gap-2 text-sm mt-1 text-gray-600">
            <p>
              {docInfo.degree} - {docInfo.speciality}
            </p>
            <button className="py-0.5 px-2 border text-xs rounded-full">
              {docInfo.experience}
            </button>
          </div>
          <div>
            <p className="flex items-center gap-1 text-sm font-medium text-gray-900 mt-3">
              About <img src={assets.info_icon} alt="Info" />
            </p>
            <p className="text-sm text-gray-500 max-w-[700px] mt-1">{docInfo.about}</p>
          </div>
          <p className="text-gray-500 font-medium mt-4">
            Appointment fee:{" "}
            <span className="text-gray-600">
              {currencySymbol}
              {docInfo.fees}
            </span>
          </p>
        </div>
      </div>
      {/* Créneaux horaires */}
      <div className="sm:ml-72 sm:pl-4 mt-4 font-medium text-gray-700">
        <p>Booking slots</p>
        <div className="flex gap-3 items-center w-full overflow-x-scroll mt-4">
          {docSlots.map((day, index) => (
            <div
              key={index}
              className={`text-center py-6 min-w-16 rounded-full cursor-pointer ${
                selectedDay === index ? "bg-primary text-white" : "border border-gray-200"
              }`}
              onClick={() => setSelectedDay(index)}
            >
              <p className="font-semibold">{day.date.split(" ")[0]}</p>
              <p className="text-sm">{day.date.split(" ")[1]}</p>
            </div>
          ))}
        </div>
        {/* Créneaux horaires pour le jour sélectionné */}
        <div className="flex flex-wrap gap-3 mt-4">
          {docSlots[selectedDay]?.slots.map((slot, idx) => (
            <button
              key={idx}
              className={`py-2 px-4 border rounded-full hover:bg-gray-200 ${
                selectedDay === idx ? "bg-primary text-white" : ""
              }`}
            >
              {slot.time}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Appointments;
