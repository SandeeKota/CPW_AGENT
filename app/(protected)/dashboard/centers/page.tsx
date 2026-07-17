"use client";
import CreateProjectModal from "@/app/components/dashboard/create-project-dialog";
import ProjectCard from "@/app/components/dashboard/project-card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Plus, Search } from "lucide-react";
import React, { useEffect, useState } from "react";
import LoadingScreen from "../../../components/loadingScreen";
import { useAppSelector } from "@/app/lib/redox/hooks";
import { useProjectsHook } from "@/app/lib/storeHooks/useProjects";
import { ProjectModal } from "@/app/_types/project.types";
import { useAuthStore } from "@/app/stores/authStore";
import api from "@/app/_services/api_service";
import { useSnackbar } from "@/app/components/SnackbarContext";
import Pagination from "@/app/components/pagination";
import { isUserIsAdminCheck } from "@/lib/constants";
import { canAccessCenterPermission } from "@/app/_types/admin-credential.enum";
import { useAdminCredentials } from "@/app/lib/storeHooks/useAdminCredentials";

const PAGE_LIMIT: number = 10;

const Projects = () => {
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [perLimit, setPerLimit] = useState<number>(PAGE_LIMIT || 10);
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [centerTypeFilter, setCenterTypeFilter] = useState<
    "all" | "school" | "village"
  >("all");
  const [showClearFilter, setShowClearFilter] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const snackbar = useSnackbar();
  const { selectedCurrency } = useAppSelector(
    (state) => state?.geoLocationSlice,
  );
  const [file, setFile] = useState();

  const {
    projects,
    loading,
    fetchProjects,
    totalPages,
    currentPage,
    totalCount,
  } = useProjectsHook();
  const [projectsList, setProjectsList] = useState<ProjectModal[]>([]);

  const { user: db_user } = useAuthStore();
  const isAdmin = isUserIsAdminCheck(db_user) || false;
  const { credentials } = useAdminCredentials(user?._id);
  const canAddCenter = canAccessCenterPermission(
    isAdmin,
    credentials,
    user?.role || "user",
  );

  //     const { credentials } = useAdminCredentials(db_user?._id);
  //   const canAddCampaign = canAccessFundraiserPermission(isAdmin, credentials, db_user?.role || "user");

  const loadProject = async (
    pageNumber = 0,
    perLimit = 0,
    status = "",
    search = "",
    centerType = "",
  ) => {
    await fetchProjects(
      pageNumber,
      perLimit,
      status === "all" ? "" : status,
      search,
      centerType === "all" ? "" : centerType,
    );
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadProject(
        pageNumber,
        perLimit,
        statusFilter === "all" ? "" : statusFilter,
        searchQuery.trim(),
        centerTypeFilter,
      );
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [pageNumber, perLimit, statusFilter, searchQuery, centerTypeFilter]);

  useEffect(() => {
    setProjectsList(projects || []);
  }, [projects]);

  useEffect(() => {
    if (
      searchQuery?.trim() !== "" ||
      (statusFilter?.trim() !== "" && statusFilter !== "all") ||
      centerTypeFilter !== "all"
    ) {
      setShowClearFilter(true);
    } else {
      setShowClearFilter(false);
    }
  }, [searchQuery, statusFilter, centerTypeFilter]);

  const handleClearFilter = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setCenterTypeFilter("all");
    setPageNumber(1);
  };

  const handlePageChange = (page: number) => {
    setPageNumber(page);
  };

  const handleUpload = async (fileData: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", fileData); // Key must match backend
    try {
      setIsUploading(true);
      const response = await api.post("/v1/projects/csv-upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setIsUploading(false);
      if (response && response?.status === 200) {
        snackbar.show(
          "File uploaded successfully /centers will update after file process",
          {
            type: "success",
            duration: 3000,
          },
        );
      } else {
        snackbar.show("File uploaded successfully", {
          type: "success",
          duration: 3000,
        });
      }
      console.log("Upload response:", response.data);
    } catch (err: any) {
      setIsUploading(false);
      alert(
        "Upload failed: " +
          (err?.response?.data?.error || err?.message || "Unknown error"),
      );
    }
  };

  const handleDelete = (project_id: string) => {
    const projectsData = projectsList.filter(
      (project) => project._id !== project_id,
    );
    setProjectsList(projectsData);
  };

  return (
    <React.Fragment>
      <div className="flex-1 flex flex-col overflow-hidden relative py-4 md:py-6 ">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <button
              disabled
              type="button"
              className="py-2.5 px-5 me-2 text-sm font-medium text-gray-900 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 inline-flex items-center"
            >
              <svg
                aria-hidden="true"
                role="status"
                className="inline w-4 h-4 me-3 text-gray-200 animate-spin dark:text-gray-600"
                viewBox="0 0 100 101"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                  fill="currentColor"
                />
                <path
                  d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                  fill="#1C64F2"
                />
              </svg>
              Loading...
            </button>
          </div>
        ) : (
          <React.Fragment>
            <div className="w-full px-4 md:px-6">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Centers</h1>
                {/* {isAdmin && ( */}
                <div className="flex items-center justify-center gap-3">
                  {/* <div className='relative flex text-base border-black rounded-lg border min-h-9 px-3 items-center justify-center  ' >
                                {
                                    (isUploading) && <div className="w-6 h-6 mr-2 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin mx-auto" />
                                }
                                {
                                    (!isUploading) && <Plus className="mr-2 h-4 w-4" />
                                }
                                {
                                    (isUploading) ? <p>Uploading...</p> : <p>Upload CSV</p>
                                }
                                <input
                                    type="file"
                                    accept=".csv"
                                    className="opacity-0 absolute top-0 left-0 w-full h-full"
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            console.log("Selected file:", file);
                                            handleUpload(file);
                                        }
                                        setTimeout(() => {
                                            e.target.value = '';
                                        }, 200);
                                    }}
                                />
                            </div> */}
                  {canAddCenter ? (
                    <CreateProjectModal>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Center
                      </Button>
                    </CreateProjectModal>
                  ) : (
                    <></>
                  )}
                </div>
                {/* )} */}
              </div>
            </div>
            <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden px-4 md:px-6">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {[
                  { label: "All", value: "all" },
                  { label: "Schools", value: "school" },
                  { label: "Villages", value: "village" },
                ].map((filterItem) => (
                  <Button
                    key={filterItem.value}
                    type="button"
                    variant={
                      centerTypeFilter === filterItem.value
                        ? "default"
                        : "outline"
                    }
                    className="rounded-full"
                    onClick={() => {
                      setPageNumber(1);
                      setCenterTypeFilter(
                        filterItem.value as "all" | "school" | "village",
                      );
                    }}
                  >
                    {filterItem.label}
                  </Button>
                ))}
              </div>
              <div className="flex flex-col pt-2 gap-4 md:flex-row md:items-center mb-6">
                <div className="relative flex-1 mx-2 items-center ">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search"
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => {
                      setPageNumber(1);
                      setSearchQuery(e.target.value);
                    }}
                    disabled={loading || !projectsList}
                  />
                </div>
                {showClearFilter && (
                  <Button onClick={() => handleClearFilter()}>
                    Clear Filter
                  </Button>
                )}
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setPageNumber(1);
                    setStatusFilter(value);
                  }}
                >
                  <SelectTrigger className="w-full md:w-[180px] ">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem className="capitalize" value="all">
                      All
                    </SelectItem>
                    <SelectItem className="capitalize" value="active">
                      active
                    </SelectItem>
                    <SelectItem className="capitalize" value="completed">
                      completed
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {projectsList && projectsList.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {projectsList.map((project: ProjectModal) => (
                    <ProjectCard
                      key={project._id}
                      project={project}
                      onDelete={(deleteId) => handleDelete(deleteId)}
                      isAdmin={isAdmin}
                      hasCenterPermission={canAddCenter}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-lg text-muted-foreground">
                    {!showClearFilter && (
                      <span className=" text-muted-foreground">
                        No centers have been added yet.
                      </span>
                    )}
                    {showClearFilter && (
                      <span className=" text-muted-foreground">
                        No centers found.
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>

            <div className="w-full px-4 md:px-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={totalCount}
                limitNum={perLimit || PAGE_LIMIT}
              />
            </div>
          </React.Fragment>
        )}
      </div>
    </React.Fragment>
  );
};

export default Projects;
