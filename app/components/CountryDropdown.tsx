import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { country_codes } from "../utils/country_codes";

export default function CountryDropdown({
  value,
  onChange,
}: {
  value: string | null; // only phoneCode
  onChange: (val: string) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = country_codes.filter((country) => {
    const searchLower = search.toLowerCase();
    return (
      country.name.toLowerCase().includes(searchLower) ||
      country.code.toLowerCase().includes(searchLower) ||
      country.phoneCode.includes(search)
    );
  });

  const selectedCountry = country_codes.find((c) => c.phoneCode === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div
          className="bg-white cursor-pointer rounded-3x outline-none min-h-[30px]
                    placeholder:text-[#3B3B3B99] text-primary-black relative flex items-center justify-between 
                    overflow-hidden min-w-fit !max-w-full"
        >
          <p className="text-[16px]  font-signika font-normal truncate">
            {selectedCountry
              ? `(${selectedCountry.phoneCode})`
              : "Choose your country"}
          </p>
          <ChevronDown size={18} strokeWidth={2} color="#3B3B3B99" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="border border-gray-200 shadow-2xl rounded-xl p-3 bg-white w-[300px]  overflow-y-auto flex flex-col gap-2"
      >
        <input
          type="text"
          placeholder="Search country"
          className="p-2 border border-gray-300 rounded-md text-sm outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="max-h-[300px] overflow-y-auto flex flex-col">
          {filtered.length === 0 && (
            <p className="text-sm font-calluna font-normal text-gray-400 p-2">
              No countries found.
            </p>
          )}
          {filtered.map((country, index) => (
            <DropdownMenuItem
              key={`${country.code}-${index}`}
              onClick={() => onChange(country.phoneCode)}
              className="text-sm text-primary-black font-signika font-medium  hover:bg-teal-300 py-1 px-2 rounded-sm cursor-pointer"
            >
              <span className="flex gap-2 items-center">
                <span>{country.flagEmoji}</span>
                <span>{country.name}</span>
                <span className="text-gray-400 ml-auto">
                  {country.phoneCode}
                </span>
              </span>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
