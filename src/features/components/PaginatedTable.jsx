import React, { useState } from 'react';
import Pagination from './Pagination'; // Import component Pagination.jsx

const PaginatedTable = ({ data, columns, itemsPerPage = 10, emptyMessage = "No data found." }) => {
  const [currentPage, setCurrentPage] = useState(1);

  if (!data || data.length === 0) {
    return <div className="no-data"><p>{emptyMessage}</p></div>;
  }

  // Logic chia trang
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="paginated-table-wrapper">
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              {columns.map(column => <th key={column.header}>{column.header}</th>)}
            </tr>
          </thead>
          <tbody>
            {currentItems.map((item, index) => (
              <tr key={item.userId || item.appointmentId || index}>
                {columns.map(column => (
                  <td key={column.accessor || column.header}>
                    {/* `cell` là hàm render tùy chỉnh cho từng ô */}
                    {column.cell ? column.cell(item) : item[column.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        itemsPerPage={itemsPerPage}
        totalItems={data.length}
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default PaginatedTable;