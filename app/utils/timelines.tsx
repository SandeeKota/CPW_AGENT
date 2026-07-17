export const getTimelineInfo = ({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) => {
  const today = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Clear time portion
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const totalDays = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
  const daysLeft = Math.ceil(
    (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  const daysCompleted = Math.ceil(
    (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );

  let status: string;

  if (today < start) {
    status = `Campaign starts in ${Math.abs(daysCompleted)} day(s)`;
  } else if (today > end) {
    status = `Campaign ended ${Math.abs(daysLeft)} day(s) ago`;
  } else if (daysLeft === 0) {
    status = `Campaign ends today`;
  } else {
    status = `${daysLeft} day(s) left`;
  }

  return {
    totalDays,
    daysCompleted: Math.min(daysCompleted, totalDays),
    daysLeft: Math.max(daysLeft, 0),
    status,
  };
};
