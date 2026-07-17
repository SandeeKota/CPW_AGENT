import { IMAGE_LINKS } from "@/assets/constants";
import { X } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";

interface Props {
  selectedImage?: string;
  onChange: (image: string) => void;
  onClose?: () => void;
}
const ImageGallery: React.FC<Props> = ({
  selectedImage,
  onChange,
  onClose,
}) => {
  const [libraryImages, setLibraryImages] = useState<string[]>([
    ...Object.values(IMAGE_LINKS),
  ]);
  const imagesCopy = [...Object.values(IMAGE_LINKS)];
  const [pickedImage, setPickedImage] = useState<string | null>(null);

  useEffect(() => {
    setPickedImage(selectedImage || "");
  }, [selectedImage]);
  useEffect(() => {
    setPickedImage("");
  }, []);

  const handleSelectImage = (image: string) => {
    setPickedImage(image);
  };
  const onSelect = () => {
    onChange(pickedImage || selectedImage || "");
  };

  return (
    <React.Fragment>
      <div className="fixed inset-0 z-[2500] bg-black/50 backdrop-blur-xs w-screen h-screen flex flex-col items-center justify-center">
        <div className="w-full h-full screen1024:max-h-[70vh] max-h-[90vh] screen1024:max-w-[70vw] max-w-[340px] sm:w-fit bg-white p-5 rounded-3xl  flex flex-col items-center justify-center gap-5 ">
          <div className="w-full overflow-hidden flex flex-row items-center justify-between">
            <p className="text-[#3B3B3B] font-calluna text-[16px] font-normal ">
              Choose an image
            </p>
            <button
              type="button"
              onClick={() => onClose && onClose()}
              className="outline-none cursor-pointer "
            >
              <X size={20} color="#3B3B3B" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden flex screen1024:flex-row flex-col gap-3">
            <div
              className="flex-1 max-w-[488px] w-full overflow-x-hidden overflow-y-auto grid 
                        screen1200:grid-cols-4 screen1024:grid-cols-3 grid-cols-4
                        gap-2"
            >
              {libraryImages.map((image, index) => {
                return (
                  <div
                    key={index}
                    className="
                                        screen1200:w-[105px] screen1200:h-[105px] 
                                        scree1024:w-[105px] scree1024:h-[105px]
                                        w-[70px] h-[70px]
                                        transform hover:scale-105 transition-all 
                                        scree1024:rounded-[20px] rounded-[10px] overflow-hidden cursor-pointer"
                    onClick={() => handleSelectImage(image)}
                  >
                    <Image
                      src={image}
                      alt="img"
                      width={110}
                      height={110}
                      className="w-full h-full "
                      loading="eager"
                    />
                  </div>
                );
              })}
            </div>
            {pickedImage && (
              <div className="w-[330px] screen1024:h-full h-[262px] rounded-[20px] overflow-hidden flex flex-col justify-between ">
                <div className="screen1024:w-[330px] w-[306px] h-[262px] mx-auto screen1024:h-[330px] overflow-hidden ">
                  {pickedImage && (
                    <Image
                      src={pickedImage}
                      alt="img"
                      width={330}
                      height={284}
                      className="w-full h-full rounded-[20px] "
                      loading="eager"
                    />
                  )}
                </div>
                <button
                  onClick={() => {
                    onSelect();
                  }}
                  className="px-3 screen1024:mt-auto mt-3 screen1024:mx-0 mx-auto cursor-pointer rounded-3xl screen1024:mb-3  max-w-fit ml-auto bg-[#e8f2f3] "
                >
                  <p className="text-primary-black  font-signika text-[18px] font-medium shadow-xs ">
                    SELECT
                  </p>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default ImageGallery;
