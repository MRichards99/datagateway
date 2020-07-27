import {
  Entity,
  fetchInstrumentCount,
  fetchInstrumentDetails,
  fetchInstruments,
  Filter,
  FiltersType,
  Instrument,
  Order,
  pushPageFilter,
  pushPageSort,
  SortType,
  Table,
  tableLink,
  TextColumnFilter,
} from 'datagateway-common';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { IndexRange, TableCellProps } from 'react-virtualized';
import { AnyAction } from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import { StateType } from '../../../state/app.types';
import InstrumentDetailsPanel from '../../detailsPanels/isis/instrumentDetailsPanel.component';

interface ISISInstrumentsTableStoreProps {
  sort: SortType;
  filters: FiltersType;
  data: Entity[];
  totalDataCount: number;
  loading: boolean;
  error: string | null;
}

interface ISISInstrumentsTableDispatchProps {
  pushSort: (sort: string, order: Order | null) => Promise<void>;
  pushFilters: (filter: string, data: Filter | null) => Promise<void>;
  fetchData: (offsetParams: IndexRange) => Promise<void>;
  fetchCount: () => Promise<void>;
  fetchDetails: (instrumentId: number) => Promise<void>;
}

type ISISInstrumentsTableCombinedProps = ISISInstrumentsTableStoreProps &
  ISISInstrumentsTableDispatchProps;

const ISISInstrumentsTable = (
  props: ISISInstrumentsTableCombinedProps
): React.ReactElement => {
  const {
    data,
    totalDataCount,
    fetchData,
    fetchCount,
    sort,
    pushSort,
    filters,
    pushFilters,
    loading,
  } = props;

  const [t] = useTranslation();

  const textFilter = (label: string, dataKey: string): React.ReactElement => (
    <TextColumnFilter
      label={label}
      value={filters[dataKey] as string}
      onChange={(value: string) => pushFilters(dataKey, value ? value : null)}
    />
  );

  React.useEffect(() => {
    fetchCount();
    fetchData({ startIndex: 0, stopIndex: 49 });
  }, [fetchData, fetchCount, sort, filters]);

  return (
    <Table
      loading={loading}
      data={data}
      loadMoreRows={fetchData}
      totalRowCount={totalDataCount}
      sort={sort}
      onSort={pushSort}
      detailsPanel={({ rowData, detailsPanelResize }) => {
        return (
          <InstrumentDetailsPanel
            rowData={rowData}
            detailsPanelResize={detailsPanelResize}
            fetchDetails={props.fetchDetails}
          />
        );
      }}
      columns={[
        {
          label: t('instruments.name'),
          dataKey: 'FULLNAME',
          cellContentRenderer: (props: TableCellProps) => {
            const instrumentData = props.rowData as Instrument;
            return tableLink(
              `/browse/instrument/${instrumentData.ID}/facilityCycle`,
              instrumentData.FULLNAME || instrumentData.NAME
            );
          },
          filterComponent: textFilter,
        },
      ]}
    />
  );
};

const mapDispatchToProps = (
  dispatch: ThunkDispatch<StateType, null, AnyAction>
): ISISInstrumentsTableDispatchProps => ({
  pushSort: (sort: string, order: Order | null) =>
    dispatch(pushPageSort(sort, order)),
  pushFilters: (filter: string, data: Filter | null) =>
    dispatch(pushPageFilter(filter, data)),
  fetchData: (offsetParams: IndexRange) =>
    dispatch(fetchInstruments(offsetParams)),
  fetchCount: () => dispatch(fetchInstrumentCount()),
  fetchDetails: (instrumentId: number) =>
    dispatch(fetchInstrumentDetails(instrumentId)),
});

const mapStateToProps = (state: StateType): ISISInstrumentsTableStoreProps => {
  return {
    sort: state.dgcommon.sort,
    filters: state.dgcommon.filters,
    data: state.dgcommon.data,
    totalDataCount: state.dgcommon.totalDataCount,
    loading: state.dgcommon.loading,
    error: state.dgcommon.error,
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ISISInstrumentsTable);