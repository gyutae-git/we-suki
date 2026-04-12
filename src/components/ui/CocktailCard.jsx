export default function CocktailCard({ cocktail, onClick }) {
  return (
    <div 
      onClick={onClick}
      className="group cursor-pointer flex flex-col gap-3 outline-none"
    >
      <div className="aspect-[4/5] w-full rounded-2xl bg-gray-50 overflow-hidden relative border border-gray-100">
        <img 
          src={cocktail.photo} 
          alt={cocktail.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
      </div>
      <div className="px-1 flex flex-col items-center">
        <h3 className="font-bold text-[16px] text-gray-900 leading-tight">{cocktail.name}</h3>
        <p className="text-[13px] text-gray-400 mt-1">평가하기</p>
      </div>
    </div>
  );
}
