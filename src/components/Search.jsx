import React from "react";

const Search = () => {
    return (
        <div className="px-4 sm:px-6 md:px-0">
            <div className="mt-8 sm:mt-10">
                <h1 className="text-2xl sm:text-3xl font-medium text-center text-black px-4">
                    Le marketing d'influence rendu simple.
                </h1>
                <h3 className="text-center text-gray text-sm font-light mt-2 px-4">
                    Collaborez avec les meilleurs créateurs pour propulser votre marque.
                </h3>
            </div>

            <div className="w-full mt-6">
                <form className="mx-auto w-full max-w-3xl">
                    {/* Search Bar - Mobile Optimized */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-white rounded-2xl sm:rounded-full shadow-md overflow-hidden">
                        <select
                            aria-label="Réseau social"
                            className="w-full sm:min-w-[140px] md:min-w-[180px] px-4 py-3 text-sm bg-white border-b sm:border-b-0 sm:border-r border-gray-200 appearance-none cursor-pointer"
                        >
                            <option value="tiktok">TikTok</option>
                        </select>
                        
                        <select
                            aria-label="Catégorie"
                            className="w-full sm:min-w-[140px] px-4 py-3 text-sm bg-white border-b sm:border-b-0 sm:border-r border-gray-200 appearance-none cursor-pointer"
                        >
                            <option value="all">Toutes catégories</option>
                            <option value="fashion">Fashion</option>
                        </select>
                        
                        <input
                            aria-label="Rechercher"
                            type="text"
                            placeholder="Tapez un mot-clé..."
                            className="flex-1 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 bg-white outline-none min-w-0"
                        />
                        
                        <button 
                            type="submit"
                            className="bg-primary text-white px-6 py-3 sm:rounded-r-full text-sm font-medium hover:bg-primary/90 transition-colors"
                        >
                            Rechercher
                        </button>
                    </div>

                    {/* Categories Bar - Horizontal Scroll on Mobile */}
                    <div className="flex items-center gap-2 sm:gap-3 mt-4 sm:mt-6 overflow-x-auto py-2 scrollbar-hide">
                        <button className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white rounded-full border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 whitespace-nowrap flex-shrink-0">
                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="hidden sm:inline">Nouvelles stars TikTok</span>
                            <span className="sm:hidden">Nouvelles stars TikTok</span>
                        </button>
                        
                        <button className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white rounded-full border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 whitespace-nowrap flex-shrink-0">
                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            Les Plus Vu
                        </button>
                        
                        <button className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white rounded-full border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 whitespace-nowrap flex-shrink-0">
                            <span className="text-sm sm:text-base">$</span>
                            <span className="hidden sm:inline">Moins de $250</span>
                            <span className="sm:hidden">-$250</span>
                        </button>
                        
                        <button className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white rounded-full border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 whitespace-nowrap flex-shrink-0">
                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            Fashion
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Search;

