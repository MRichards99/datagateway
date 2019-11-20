import React from 'react';
import {
  TextColumnFilter,
  Table,
  formatBytes,
  Filter,
  Order,
  Entity,
  Datafile,
  DateColumnFilter,
} from 'datagateway-common';
import { Paper, Typography } from '@material-ui/core';
import {
  fetchDatafiles,
  sortTable,
  filterTable,
  fetchDatafileCount,
  clearTable,
} from '../../state/actions';
import { ThunkDispatch } from 'redux-thunk';
import { connect } from 'react-redux';
import { StateType } from '../../state/app.types';
import { Action, AnyAction } from 'redux';
import { IndexRange } from 'react-virtualized';
import useAfterMountEffect from '../../utils';

interface DLSDatafilesTableProps {
  datasetId: string;
}

interface DLSDatafilesTableStoreProps {
  sort: {
    [column: string]: Order;
  };
  filters: {
    [column: string]: Filter;
  };
  data: Entity[];
  totalDataCount: number;
  loading: boolean;
  error: string | null;
}

interface DLSDatafilesTableDispatchProps {
  sortTable: (column: string, order: Order | null) => Action;
  filterTable: (column: string, filter: Filter | null) => Action;
  fetchData: (datasetId: number, offsetParams: IndexRange) => Promise<void>;
  fetchCount: (datasetId: number) => Promise<void>;
  clearTable: () => Action;
}

type DLSDatafilesTableCombinedProps = DLSDatafilesTableProps &
  DLSDatafilesTableStoreProps &
  DLSDatafilesTableDispatchProps;

const DLSDatafilesTable = (
  props: DLSDatafilesTableCombinedProps
): React.ReactElement => {
  const {
    data,
    totalDataCount,
    fetchData,
    fetchCount,
    clearTable,
    sort,
    sortTable,
    filters,
    filterTable,
    datasetId,
  } = props;

  React.useEffect(() => {
    clearTable();
  }, [clearTable]);

  useAfterMountEffect(() => {
    fetchCount(parseInt(datasetId));
    fetchData(parseInt(datasetId), { startIndex: 0, stopIndex: 49 });
  }, [fetchCount, fetchData, sort, filters, datasetId]);

  const textFilter = (label: string, dataKey: string): React.ReactElement => (
    <TextColumnFilter
      label={label}
      onChange={(value: string) => filterTable(dataKey, value ? value : null)}
    />
  );

  const dateFilter = (label: string, dataKey: string): React.ReactElement => (
    <DateColumnFilter
      label={label}
      onChange={(value: { startDate?: string; endDate?: string } | null) =>
        filterTable(dataKey, value)
      }
    />
  );

  return (
    <Paper style={{ height: 'calc(100vh - 64px)', width: '100%' }}>
      <Table
        data={data}
        loadMoreRows={params => fetchData(parseInt(datasetId), params)}
        totalRowCount={totalDataCount}
        sort={sort}
        onSort={sortTable}
        detailsPanel={({ rowData }) => {
          const datafileData = rowData as Datafile;
          return (
            <div>
              <Typography variant="body2">
                <b>Name:</b> {datafileData.NAME}
              </Typography>
              <Typography variant="body2">
                <b>Description:</b> {datafileData.DESCRIPTION}
              </Typography>
              <Typography variant="body2">
                <b>File Size:</b> {formatBytes(datafileData.FILESIZE)}
              </Typography>
              <Typography variant="body2">
                <b>Location:</b> {datafileData.LOCATION}
              </Typography>
            </div>
          );
        }}
        columns={[
          {
            label: 'Name',
            dataKey: 'NAME',
            filterComponent: textFilter,
          },
          {
            label: 'Location',
            dataKey: 'LOCATION',
            filterComponent: textFilter,
          },
          {
            label: 'Size',
            dataKey: 'FILESIZE',
            cellContentRenderer: props => {
              return formatBytes(props.cellData);
            },
            filterComponent: textFilter,
          },
          {
            label: 'Create Time',
            dataKey: 'CREATE_TIME',
            filterComponent: dateFilter,
          },
        ]}
      />
    </Paper>
  );
};

const mapDispatchToProps = (
  dispatch: ThunkDispatch<StateType, null, AnyAction>
): DLSDatafilesTableDispatchProps => ({
  sortTable: (column: string, order: Order | null) =>
    dispatch(sortTable(column, order)),
  filterTable: (column: string, filter: Filter | null) =>
    dispatch(filterTable(column, filter)),
  fetchData: (datasetId: number, offsetParams: IndexRange) =>
    dispatch(fetchDatafiles(datasetId, offsetParams)),
  fetchCount: (datasetId: number) => dispatch(fetchDatafileCount(datasetId)),
  clearTable: () => dispatch(clearTable()),
});

const mapStateToProps = (state: StateType): DLSDatafilesTableStoreProps => {
  return {
    sort: state.dgtable.sort,
    filters: state.dgtable.filters,
    data: state.dgtable.data,
    totalDataCount: state.dgtable.totalDataCount,
    loading: state.dgtable.loading,
    error: state.dgtable.error,
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DLSDatafilesTable);