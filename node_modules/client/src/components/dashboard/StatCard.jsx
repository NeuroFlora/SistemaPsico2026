import React from "react";
import { Card, CardContent } from "../../components/ui/Card";

const StatCard = ({
  title,
  value,
  icon: Icon,
  color = "bg-gray-500",
  trend,
}) => (
  <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {typeof trend !== "undefined" && trend !== null && (
            <p className="text-xs text-green-600 mt-1">↗ +{trend}% este mes</p>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}
        >
          {Icon ? <Icon className="w-6 h-6 text-white" /> : null}
        </div>
      </div>
    </CardContent>
  </Card>
);

export default StatCard;
