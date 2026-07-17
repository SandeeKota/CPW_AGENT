// components/Pagination.tsx
import React from "react";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisiblePages?: number; // optional, default is 5
  totalItems: number;
  limitNum: number;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 5,
  totalItems = 0,
  limitNum = 10,
}) => {
  const startItem = ((currentPage || 0) - 1) * (limitNum || 0) + 1;
  const endItem = Math.min(
    (currentPage || 0) * (limitNum || 0),
    totalItems || 0,
  );

  const getPageNumbers = () => {
    const pages = [];

    const half = Math.floor(maxVisiblePages / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, currentPage + half);

    if (currentPage <= half) {
      end = Math.min(totalPages, maxVisiblePages);
    } else if (currentPage + half >= totalPages) {
      start = Math.max(1, totalPages - maxVisiblePages + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  return (
    <div className="flex items-end justify-between">
      <div className="">
        <span className="text-sm md:block hidden">
          Total Items: {totalItems || 0}
          <span>&nbsp;-&nbsp;</span>
          {`(${startItem || 0}-${endItem || 0})`}
        </span>
      </div>
      <div className="flex items-center justify-center gap-1 mt-4">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
        >
          Prev
        </button>

        {getPageNumbers().map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-1 rounded ${
              page === currentPage
                ? "bg-blue-600 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
        >
          Next
        </button>
      </div>
      <div className=""></div>
    </div>
  );
};

export default Pagination;
