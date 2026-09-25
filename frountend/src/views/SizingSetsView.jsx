import {
  useEffect,
  useMemo,
  useState,
  useCallback
} from 'react';

import {
  Plus,
  Search,
  Layers,
  Edit2,
  Trash2,
  ArrowLeft,
  Loader2,
  Package,
  Calendar,
  Building2,
  FileText,
  Tag,
  Hash,
  CheckCircle2
} from 'lucide-react';

import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Modal } from '../components/Modal';


/* =========================================================
   CONSTANTS
========================================================= */

const today = () =>
  new Date().toISOString().split('T')[0];


/* =========================================================
   HELPERS
========================================================= */

const formatDate = (date) => {
  if (!date) return '';

  if (Array.isArray(date)) {
    const [y, m, d] = date;

    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  return String(date).substring(0, 10);
};


const toNumberOrNull = (value) => {
  if (
    value === '' ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const parsed = Number(value);

  return Number.isNaN(parsed)
    ? null
    : parsed;
};


const nextSetNoFromList = (
  existingSets = []
) => {

  let maxNumber = 0;

  existingSets.forEach(item => {
    // Skip soft-deleted records so they don't inflate the counter
    if ((item?.status || '').toUpperCase() === 'DELETED') return;
    const match = String(item?.setNo || '').match(/(\d+)$/);
    if (match) {

      const parsed =
        Number(match[1]);

      if (
        !Number.isNaN(parsed) &&
        parsed > maxNumber
      ) {
        maxNumber = parsed;
      }
    }
  });
  // 2-digit padding: single digit gets one leading zero (SET-01), 10+ no extra zeros
  return `SET-${String(maxNumber + 1).padStart(2, '0')}`;
};


const createEmptyHeader = () => ({
  setNo: '',
  setDate: today(),

  orderNo: '',
  orderId: '',

  partyId: '',
  firmName: '',

  quality: '',
  totalEnds: '',

  cone: '',
  partNo: '',

  sizingMtr: '',

  countId: '',
  tickitId: '',

  status: 'OPEN'
});


/* =========================================================
   COMPONENT
========================================================= */

export const SizingSetsView = () => {

  const {
    fabricOrders,
    tickits,
    yarnCounts,
    addToast
  } = useApp();


  /* =========================================================
     ORDERS
  ========================================================= */

  const openOrders = useMemo(
    () =>
      fabricOrders.filter(
        order =>
          (order.status || 'OPEN').toUpperCase() !== 'CLOSED' &&
          !order.complete
      ),
    [fabricOrders]
  );


  /* =========================================================
     SIZING SET STATE
  ========================================================= */

  const [sizingSets, setSizingSets] =
    useState([]);

  const [loadingSets, setLoadingSets] =
    useState(false);

  const [search, setSearch] =
    useState('');

  const [editorOpen, setEditorOpen] =
    useState(false);

  const [editingSet, setEditingSet] =
    useState(null);

  const [saving, setSaving] =
    useState(false);

  const [loadingOrderDetails, setLoadingOrderDetails] =
    useState(false);


  /* =========================================================
     ISSUE YARN STATE
  ========================================================= */

  const [issueModalOpen, setIssueModalOpen] =
    useState(false);

  const [issueRows, setIssueRows] =
    useState([]);

  // Rows confirmed with Done stay out of the picker for this sizing-set form.
  const [excludedIssueKeys, setExcludedIssueKeys] =
    useState([]);

  const [issueSearch, setIssueSearch] =
    useState('');

  const [issueTypeFilter, setIssueTypeFilter] =
    useState('all');

  const [loadingIssueRows, setLoadingIssueRows] =
    useState(false);


  /* =========================================================
     GATE PASS STATE
  ========================================================= */

  const [gatePassLots, setGatePassLots] =
    useState([]);

  const [loadingLots, setLoadingLots] =
    useState(false);


  /* =========================================================
     HEADER
  ========================================================= */

  const [header, setHeader] =
    useState(createEmptyHeader());


  /* =========================================================
     YARN ALLOCATION
     
     IMPORTANT:
     These rows ONLY come from Issue Yarn.
     They are never manually added.
  ========================================================= */

  const [yarnLines, setYarnLines] =
    useState([]);


  /* =========================================================
     FETCH SIZING SETS
  ========================================================= */

  const fetchSizingSets =
    useCallback(async () => {

      setLoadingSets(true);

      try {

        const data =
          await api.sizingSets.getAll();

        setSizingSets(
          Array.isArray(data)
            ? data.filter(
                item =>
                  item.status !== 'DELETED'
              )
            : []
        );

      } catch (err) {

        addToast(
          err.message ||
            'Failed to fetch sizing sets',
          'error'
        );

      } finally {

        setLoadingSets(false);

      }

    }, [addToast]);


  /* =========================================================
     FETCH GATE PASS LOTS
  ========================================================= */

  const fetchGatePassLots =
    useCallback(async () => {

      setLoadingLots(true);

      try {

        const lots =
          await api.gatePasses.getActiveYarn();

        setGatePassLots(
          Array.isArray(lots)
            ? lots
            : []
        );

        return lots;

      } catch (err) {

        console.warn(
          'Could not load gate passes:',
          err
        );

        return [];

      } finally {

        setLoadingLots(false);

      }

    }, []);


  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {

    fetchSizingSets();

  }, [fetchSizingSets]);


  /* =========================================================
     HEADER UPDATE
  ========================================================= */

  const updateHeader = (
    field,
    value
  ) => {

    setHeader(prev => ({
      ...prev,
      [field]: value
    }));

  };


  /* =========================================================
     FILTER SIZING SETS
  ========================================================= */

  const filteredSets = useMemo(() => {

    const searchText =
      search.toLowerCase().trim();

    if (!searchText) {
      return sizingSets;
    }

    return sizingSets.filter(item => (

      item.setNo
        ?.toLowerCase()
        .includes(searchText)

      ||

      item.order?.orderNo
        ?.toLowerCase()
        .includes(searchText)

      ||

      item.party?.partyName
        ?.toLowerCase()
        .includes(searchText)

      ||

      item.quality
        ?.toLowerCase()
        .includes(searchText)

      ||

      item.partNo
        ?.toLowerCase()
        .includes(searchText)

    ));

  }, [
    sizingSets,
    search
  ]);


  /* =========================================================
     TOTALS
  ========================================================= */

  const totals = useMemo(() => {

    return yarnLines.reduce(
      (acc, line) => ({

        bags:
          acc.bags +
          Number(
            line.givenBags ?? line.bags ?? 0
          ),

        cones:
          acc.cones +
          Number(
            line.cones ?? 0
          ),

        weightKg:
          acc.weightKg +
          Number(
            line.weightKg ?? 0
          )

      }),

      {
        bags: 0,
        cones: 0,
        weightKg: 0
      }
    );

  }, [yarnLines]);


  /* =========================================================
     CREATE EDITOR
  ========================================================= */

  const openCreateEditor =
    async () => {

      setEditingSet(null);

      const next =
        createEmptyHeader();

      next.setNo =
        nextSetNoFromList(
          sizingSets
        );


      try {

        const response =
          await api.sizingSets.nextSetNo();

        if (response?.setNo) {
          next.setNo =
            response.setNo;
        }

      } catch {
        // Keep client-generated number
      }


      setHeader(next);

      /*
       * Start with NO allocation rows.
       */
      setYarnLines([]);
      setExcludedIssueKeys([]);
      setIssueRows([]);

      setEditorOpen(true);

      await fetchGatePassLots();

    };


  /* =========================================================
     EDIT EXISTING SIZING SET
  ========================================================= */

  const openEditEditor =
    async sizingSet => {

      setEditingSet(
        sizingSet
      );
      setExcludedIssueKeys([]);
      setIssueRows([]);


      setHeader({

        setNo:
          sizingSet.setNo || '',

        setDate:
          formatDate(
            sizingSet.setDate ||
            sizingSet.outDate
          ) || today(),

        orderNo:
          sizingSet.order?.orderNo || '',

        orderId:
          sizingSet.order?.orderId || '',

        partyId:
          sizingSet.party?.partyId || '',

        firmName:
          sizingSet.party?.partyName || '',

        quality:
          sizingSet.quality || '',

        totalEnds:
          sizingSet.totalEnds ?? '',

        cone:
          sizingSet.cone ?? '',

        partNo:
          sizingSet.partNo || '',

        sizingMtr:
          sizingSet.sizingMtr ?? '',

        countId:
          sizingSet.count?.countId || '',

        tickitId:
          sizingSet.tickit?.tickitId || '',

        status:
          sizingSet.status || 'OPEN'

      });


      /*
       * Existing allocation rows
       * are read-only.
       */
      const lines =
        Array.isArray(
          sizingSet.yarnLines
        )
          ? sizingSet.yarnLines
              .slice()
              .sort(
                (a, b) =>
                  (a.srNo || 0) -
                  (b.srNo || 0)
              )
              .map(line => ({

                key:
                  `line-${
                    line.yarnLineId ||
                    Math.random()
                  }`,

                serialLabel:
                  line.serialLabel ||
                  (
                    line.yarnInward
                      ?.yarnInwardId
                      ? `YIn ${line.yarnInward.yarnInwardId}`
                      : '-'
                  ),

                sourceLabel:
                  line.sourceLabel ||
                  line.sourceFrom ||
                  '-',

                /*
                 * Persisted issue type.
                 * Backend stores this in freshWinding.
                 */
                type:
                  String(
                    line.freshWinding ||
                    line.type ||
                    'FRESH'
                  ).toUpperCase(),

                freshWinding:
                  String(
                    line.freshWinding ||
                    line.type ||
                    'FRESH'
                  ),

                countId:
                  line.count?.countId ||
                  line.countId ||
                  '',

                countName:
                  line.count?.countName ||
                  line.countName ||
                  '',

                tickitId:
                  line.tickit?.tickitId ||
                  line.tickitId ||
                  '',

                tickitName:
                  line.tickit?.tickitName ||
                  line.tickitName ||
                  '',

                /*
                 * If backend already has
                 * availableBags, use it.
                 *
                 * Otherwise fall back to
                 * the allocated quantity.
                 */
                availableBags:
                  line.availableBags ??
                  line.bags ??
                  0,

                givenBags:
                  line.givenBags ??
                  line.bags ??
                  0,

                cones:
                  line.cones ?? 0,

                weightPerBag:
                  line.weightPerBag ?? '',

                weightKg:
                  line.weightKg ?? 0,

                inwardDate:
                  line.inwardDate || '',

                yarnInwardId:
                  line.yarnInward?.yarnInwardId ||
                  line.yarnInwardId ||
                  '',

                sizingInwardId:
                  line.sizingInward?.sizingInwardId ||
                  line.sizingInwardId ||
                  '',

                sourceType:
                  line.sourceType ||
                  (
                    line.sizingInwardId
                      ? 'sizingIn'
                      : 'yarnIn'
                  ),

                readOnly: true

              }))
          : [];


      setYarnLines(
        lines
      );

      setEditorOpen(true);

      await fetchGatePassLots();

    };


  /* =========================================================
     ORDER CHANGE
  ========================================================= */

  const handleOrderChange =
    async orderNo => {

      setHeader(prev => ({

        ...prev,

        orderNo,

        orderId: '',

        partyId: '',

        firmName: '',

        quality: '',

        totalEnds: '',

        cone: ''

      }));


      if (!orderNo) {
        return;
      }


      setLoadingOrderDetails(true);

      try {

        const details =
          await api.fabricOrderDetails
            .getByOrderNo(orderNo);


        setHeader(prev => ({

          ...prev,

          orderNo:
            details.orderNo ||
            orderNo,

          orderId:
            details.orderId ||
            '',

          partyId:
            details.partyId ||
            '',

          firmName:
            details.customerName ||
            '',

          quality:
            details.quality ||
            '',

          totalEnds:
            details.totalEnds ??
            '',

          cone:
            details.cone ??
            prev.cone,

          countId:
            details.countId ||
            prev.countId,

          tickitId:
            details.tickitId ||
            prev.tickitId

        }));


        addToast(
          `Order ${
            details.orderNo ||
            orderNo
          } details loaded`,
          'info'
        );

      } catch (err) {

        /*
         * Local fallback
         */
        const local =
          openOrders.find(
            item =>
              item.orderNo
                ?.trim()
                .toLowerCase() ===
              orderNo
                .trim()
                .toLowerCase()
          );


        if (local) {

          setHeader(prev => ({

            ...prev,

            orderId:
              local.orderId || '',

            partyId:
              local.party?.partyId || '',

            firmName:
              local.party?.partyName || '',

            quality:
              local.quality || '',

            countId:
              local.count?.countId || '',

            tickitId:
              local.tickit?.tickitId || ''

          }));

        } else {

          addToast(
            err.message ||
              'Could not load order details',
            'error'
          );

        }

      } finally {

        setLoadingOrderDetails(false);

      }

    };


  /* =========================================================
     ISSUE ROW KEY
  ========================================================= */

  const getIssueRowKey =
    (
      sourceType,
      id
    ) =>
      `${sourceType}-${id}`;


  /* =========================================================
     CALCULATE ALREADY ALLOCATED
     
     This is the important inventory logic.
     
     Example:
     
     Original = 500
     Previous allocation = 400
     
     Remaining = 100
  ========================================================= */

  const buildAllocatedMap =
    useCallback(() => {

      const allocatedMap = {};


      /*
       * =====================================================
       * SAVED SIZING SETS
       * =====================================================
       */

      sizingSets.forEach(set => {

        /*
         * When editing a sizing set,
         * do NOT count its own allocations.
         *
         * Otherwise its own 400 bags would
         * incorrectly reduce its available stock.
         */
        if (
          editingSet &&
          String(
            set.sizingSetId
          ) ===
          String(
            editingSet.sizingSetId
          )
        ) {
          return;
        }


        const lines =
          Array.isArray(
            set.yarnLines
          )
            ? set.yarnLines
            : [];


        lines.forEach(line => {

          const quantity =
            Number(
              line.givenBags ??
              line.bags ??
              0
            );


          if (
            !Number.isFinite(
              quantity
            ) ||
            quantity <= 0
          ) {
            return;
          }


          /*
           * YARN INWARD
           */
          if (
            line.yarnInwardId ||
            line.yarnInward?.yarnInwardId
          ) {

            const inwardId =
              line.yarnInwardId ||
              line.yarnInward.yarnInwardId;


            const key =
              getIssueRowKey(
                'yarnIn',
                inwardId
              );


            allocatedMap[key] =
              (
                Number(
                  allocatedMap[key] || 0
                )
              ) + quantity;

          }


          /*
           * SIZING INWARD
           */
          if (
            line.sizingInwardId ||
            line.sizingInward?.sizingInwardId
          ) {

            const inwardId =
              line.sizingInwardId ||
              line.sizingInward.sizingInwardId;


            const key =
              getIssueRowKey(
                'sizingIn',
                inwardId
              );


            allocatedMap[key] =
              (
                Number(
                  allocatedMap[key] || 0
                )
              ) + quantity;

          }

        });

      });


      /*
       * =====================================================
       * CURRENT UNSAVED ALLOCATION
       *
       * This prevents the user from opening Issue Yarn
       * twice and issuing the same quantity twice before
       * saving the sizing set.
       * =====================================================
       */

      yarnLines.forEach(line => {

        const quantity =
          Number(
            line.givenBags ??
            line.bags ??
            0
          );


        if (
          !Number.isFinite(
            quantity
          ) ||
          quantity <= 0
        ) {
          return;
        }


        if (
          line.yarnInwardId
        ) {

          const key =
            getIssueRowKey(
              'yarnIn',
              line.yarnInwardId
            );


          allocatedMap[key] =
            (
              Number(
                allocatedMap[key] || 0
              )
            ) + quantity;

        }


        if (
          line.sizingInwardId
        ) {

          const key =
            getIssueRowKey(
              'sizingIn',
              line.sizingInwardId
            );


          allocatedMap[key] =
            (
              Number(
                allocatedMap[key] || 0
              )
            ) + quantity;

        }

      });


      return allocatedMap;

    }, [
      sizingSets,
      editingSet,
      yarnLines
    ]);


  /* =========================================================
     FETCH ISSUE YARN
  ========================================================= */

  const fetchIssueRows =
    useCallback(async () => {

      setLoadingIssueRows(true);

      try {

        /*
         * Get current inward records.
         */
        const [
          yarnResult,
          sizingResult
        ] =
          await Promise.allSettled([

            api.yarnInward.getAll(),

            api.sizingYarnInward.getAll()

          ]);


        /*
         * Get all already allocated quantities.
         */
        const allocatedMap =
          buildAllocatedMap();


        /* ===================================================
           YARN INWARD
        =================================================== */

        const yarnRows = (

          yarnResult.status ===
          'fulfilled'
            ? yarnResult.value
            : []

        )
          .map(
            (item, index) => {

              const rowId =
                item.yarnInwardId ??
                index + 1;


              const key =
                getIssueRowKey(
                  'yarnIn',
                  rowId
                );


              const originalBags =
                Number(
                  item.originalBags ?? item.bags ?? 0
                );

              const currentAvailableBags =
                Number(
                  item.bags ?? 0
                );

              // Yarn Inward API already returns the CURRENT stock.
              // Do not subtract persisted sizing-set allocations again.
              const remainingBags =
                Math.max(
                  0,
                  currentAvailableBags
                );


              /*
               * Fully consumed.
               *
               * DO NOT SHOW IT.
               */
              if (
                remainingBags <= 0
              ) {
                return null;
              }


              return {

                key,

                sourceType:
                  'yarnIn',

                sourceLabel:
                  'Yarn In',

                type:
                  'FRESH',

                serialLabel:
                  `YIn ${rowId}`,

                id:
                  rowId,

                countId:
                  item.count?.countId ||
                  '',

                countName:
                  item.count?.countName ||
                  '',

                tickitId:
                  item.tickit?.tickitId ||
                  '',

                tickitName:
                  item.tickit?.tickitName ||
                  '',

                bags:
                  originalBags,

                currentAvailableBags:
                  currentAvailableBags,

                remainingBags:
                  remainingBags,

                weightPerBag:
                  Number(
                    item.weightPerBag ?? (
                      (item.originalWeightKg && item.originalBags)
                        ? (Number(item.originalWeightKg) / Number(item.originalBags))
                        : (
                            item.weightKg && item.bags
                              ? (Number(item.weightKg) / Number(item.bags))
                              : 0
                          )
                    )
                  ),

                weightKg:
                  Number(item.weightKg ?? 0),

                inwardDate:
                  item.inwardDate ||
                  '',

                sourceFrom:
                  'Warehouse',

                freshWinding:
                  'Fresh',

                checked:
                  false,

                issueBags:
                  '',

                issueCones:
                  Number(item.yCone ?? 0),


              };

            }
          )
          .filter(Boolean);


        /* ===================================================
           SIZING INWARD
        =================================================== */

        const sizingRows = (

          sizingResult.status ===
          'fulfilled'
            ? sizingResult.value
            : []

        )
          .map(
            (item, index) => {

              const rowId =
                item.sizingInwardId ??
                index + 1;


              const key =
                getIssueRowKey(
                  'sizingIn',
                  rowId
                );


              // Sizing-yarn inward records store current remaining stock.
              // The backend deducts bags when this source is issued, so do
              // not subtract the persisted allocation map a second time.
              const originalBags = Number(item.bags ?? 0);
              const remainingBags = Math.max(0, originalBags);


              /*
               * Fully consumed.
               */
              if (
                remainingBags <= 0
              ) {
                return null;
              }


              return {

                key,

                sourceType:
                  'sizingIn',

                sourceLabel:
                  'Sizing In',

                type:
                  'FRESH',

                serialLabel:
                  `SIn ${rowId}`,

                id:
                  rowId,

                countId:
                  item.count?.countId ||
                  '',

                countName:
                  item.count?.countName ||
                  '',

                tickitId:
                  item.tickit?.tickitId ||
                  '',

                tickitName:
                  item.tickit?.tickitName ||
                  '',

                bags:
                  originalBags,

                remainingBags:
                  remainingBags,

                weightPerBag:
                  Number(
                    item.weightPerBag ?? (
                      (item.weightKg && item.bags)
                        ? (item.weightKg / item.bags)
                        : 0
                    )
                  ),

                weightKg:
                  Number(
                    item.weightKg ?? 0
                  ),

                inwardDate:
                  item.inwardDate ||
                  '',

                sourceFrom:
                  'Sizing',

                freshWinding:
                  'Fresh',

                checked:
                  false,

                issueBags:
                  '',

                issueCones:
                  Number(item.cone ?? item.cones ?? 0) ||
                  (Number(item.weightKg ?? 0) > 0 && originalBags > 0
                    ? Number(item.weightKg ?? 0) / originalBags
                    : 0),

                weightPerBag:
                  Number(
                    item.weightPerBag ?? (
                      (item.weightKg && originalBags)
                        ? (item.weightKg / originalBags)
                        : 0
                    )
                  )

              };

            }
          )
          .filter(Boolean);


        /*
         * ===================================================
         * SORT
         * ===================================================
         */

        const sortedRows = [
          ...yarnRows,
          ...sizingRows
        ].sort(
          (a, b) => {

            const order = {
              yarnIn: 1,
              sizingIn: 2
            };

            return (
              (
                order[a.sourceType] ??
                99
              ) -
              (
                order[b.sourceType] ??
                99
              )
            )
            ||
            (
              Number(a.id) -
              Number(b.id)
            );

          }
        );


        setIssueRows(
          sortedRows.filter(row => !excludedIssueKeys.includes(row.key))
        );


      } catch (err) {

        addToast(
          err.message ||
            'Failed to load issue yarn records',
          'error'
        );

      } finally {

        setLoadingIssueRows(false);

      }

    }, [
      addToast,
      buildAllocatedMap,
      excludedIssueKeys
    ]);


  /* =========================================================
     OPEN ISSUE YARN
  ========================================================= */

  const openIssueYarnSelection =
    async () => {

      setIssueSearch('');

      setIssueTypeFilter(
        'all'
      );

      if (issueRows.length === 0 && excludedIssueKeys.length === 0) {
        await fetchIssueRows();
      }

      setIssueModalOpen(true);

    };


  /* =========================================================
     TOGGLE ISSUE ROW
  ========================================================= */

  const toggleIssueRow =
    (
      rowKey,
      checked
    ) => {

      setIssueRows(prev =>
        prev.map(row => {

          if (
            row.key !== rowKey
          ) {
            return row;
          }


          return {

            ...row,

            checked,

            /*
             * When selected, automatically
             * give all available bags.
             */
            issueBags:
              checked
                ? String(
                    Number(
                      row.remainingBags ||
                      0
                    )
                  )
                : '',

            // keep weightPerBag available for display / calc
            weightPerBag: row.weightPerBag ?? 0,

            // When auto-selecting, precompute weight = issueBags * weightPerBag
            weightKg:
              (checked
                ? Number(row.remainingBags || 0) * (Number(row.weightPerBag || 0))
                : 0),

            /*
             * Selecting the complete available quantity
             * means the whole remaining lot is issued.
             */
            type:
              checked
                ? 'FRESH'
                : 'FRESH',

            freshWinding:
              checked
                ? 'Fresh'
                : 'Fresh'

          };

        })
      );

    };


  /* =========================================================
     UPDATE GIVEN BAGS
  ========================================================= */

  const updateIssueRowBag =
    (
      rowKey,
      value
    ) => {

      setIssueRows(prev =>
        prev.map(row => {

          if (
            row.key !== rowKey
          ) {
            return row;
          }


          /*
           * Empty input.
           */
          if (
            value === ''
          ) {

            return {

              ...row,

              issueBags: '',

              issueCones:
                row.issueCones ??
                0,

              weightKg:
                0,

              type:
                'FRESH',

              freshWinding:
                'Fresh'

            };

          }


          const parsed =
            Number(value);


          const available =
            Number(
              row.remainingBags || 0
            );


          /*
           * Never allow:
           *
           * Given > Available
           */
          const safeValue =
            Math.min(
              Math.max(
                0,
                Number.isFinite(parsed)
                  ? parsed
                  : 0
              ),
              available
            );


          const issueType =
            safeValue > 0 &&
            safeValue < available
              ? 'USED'
              : 'FRESH';

          return {

            ...row,

            issueBags:
              String(
                safeValue
              ),

            type:
              issueType,

            freshWinding:
              issueType === 'USED'
                ? 'Used'
                : 'Fresh',

            // Weight is always: Given Bags × Weight Per Bag
            weightKg:
              safeValue * Number(row.weightPerBag || 0)

          };

        })
      );

    };


  /* =========================================================
     UPDATE CONES

     Cone quantity is independent of weight.
     Weight = Given Bags × Weight Per Bag
  ========================================================= */

  const updateIssueRowCone =
    (
      rowKey,
      value
    ) => {

      setIssueRows(prev =>
        prev.map(row => {

          if (row.key !== rowKey) {
            return row;
          }

          const givenBags =
            Number(row.issueBags || 0);

          if (value === '') {
            return {
              ...row,
              issueCones: '',
              weightKg: givenBags * Number(row.weightPerBag || 0)
            };
          }

          const parsed = Number(value);
          const safeCones =
            Math.max(
              0,
              Number.isFinite(parsed) ? parsed : 0
            );

          return {
            ...row,
            issueCones: String(safeCones),
            // Cone quantity does not affect weight.
            // Weight is always: Given Bags × Weight Per Bag
            weightKg: givenBags * Number(row.weightPerBag || 0)
          };

        })
      );

    };


  /* =========================================================
     ISSUE DONE
  ========================================================= */

  const handleIssueDone =
    () => {

      const selected =
        issueRows.filter(
          row => row.checked
        );


      if (
        selected.length === 0
      ) {

        addToast(
          'Select at least one inward record before clicking Done',
          'error'
        );

        return;

      }


      /*
       * Validate each selected quantity.
       */
      const invalid =
        selected.find(row => {

          const qty =
            Number(
              row.issueBags ?? 0
            );


          const available =
            Number(
              row.remainingBags ?? 0
            );


          return (

            !Number.isFinite(
              qty
            )

            ||

            qty <= 0

            ||

            qty > available

          );

        });


      if (invalid) {

        addToast(
          `Enter a valid bag quantity for ${invalid.serialLabel}. Available bags: ${invalid.remainingBags}`,
          'error'
        );

        return;

      }


      /*
       * Create read-only allocation rows.
       */
      const selectedRows =
        selected.map(
          (row, index) => {

            const availableBeforeIssue =
              Number(
                row.remainingBags ||
                0
              );

            const issuedQuantity =
              Number(
                row.issueBags ||
                0
              );

            const issueType =
              issuedQuantity > 0 &&
              issuedQuantity < availableBeforeIssue
                ? 'USED'
                : 'FRESH';

            const issuedCones =
              Number(row.issueCones || 0);

            // Weight is always: Given Bags × Weight Per Bag
            const issuedWeight =
              issuedQuantity * Number(row.weightPerBag || 0);

            return {

            key:
              `line-${Date.now()}-${index}-${Math.random()
                .toString(36)
                .slice(2, 7)}`,

            /*
             * ISSUE YARN DISPLAY
             */
            serialLabel:
              row.serialLabel ||
              '-',

            sourceLabel:
              row.sourceLabel ||
              '-',

            type:
              issueType,

            countId:
              row.countId ||
              '',

            countName:
              row.countName ||
              '',

            tickitId:
              row.tickitId ||
              '',

            tickitName:
              row.tickitName ||
              '',

            /*
             * Available BEFORE this issue.
             */
            availableBags:
              Number(
                row.remainingBags ||
                0
              ),

            /*
             * Actual quantity issued.
             */
            givenBags:
              Number(
                row.issueBags ||
                0
              ),

            cones:
              issuedCones,

            weightPerBag:
              row.weightPerBag ?? null,

            weightKg:
              issuedWeight,

            inwardDate:
              row.inwardDate ||
              '',

            sourceType:
              row.sourceType,

            sourceId:
              row.id,

            /*
             * Backend relation.
             */
            yarnInwardId:
              row.sourceType ===
              'yarnIn'
                ? row.id
                : '',

            sizingInwardId:
              row.sourceType ===
              'sizingIn'
                ? row.id
                : '',

            /*
             * Always read-only.
             */
            readOnly:
              true,

            /*
             * Keep the same value used by the backend.
             */
            freshWinding:
              issueType === 'USED'
                ? 'Used'
                : 'Fresh'

          };

          }
        );


      /*
       * ADD to existing allocation rows.
       *
       * Do NOT replace them.
       */
      setYarnLines(
        prev => [
          ...prev,
          ...selectedRows
        ]
      );

      const fullyIssuedKeys = selected
        .filter(row => Number(row.issueBags || 0) >= Number(row.remainingBags || 0))
        .map(row => row.key);

      setExcludedIssueKeys(prev => [
        ...new Set([
          ...prev,
          ...fullyIssuedKeys
        ])
      ]);


      /*
       * Remove selected rows
       * from current Issue Yarn list.
       */
      setIssueRows(prev => prev
        .filter(row => !fullyIssuedKeys.includes(row.key))
        .map(row => {
          const issued = selected.find(selectedRow => selectedRow.key === row.key);
          if (!issued) return row;

          const remainingBags = Number(row.remainingBags || 0) - Number(issued.issueBags || 0);
          return {
            ...row,
            checked: false,
            issueBags: '',
            issueCones: 0,
            remainingBags: Math.max(0, remainingBags),
            bags: Math.max(0, remainingBags)
          };
        })
      );


      setIssueModalOpen(
        false
      );


      addToast(
        `${selectedRows.length} yarn issue record(s) added to allocation`,
        'success'
      );

    };


  /* =========================================================
     FILTER ISSUE ROWS
  ========================================================= */

  const filteredIssueRows =
    issueRows.filter(row => {

      const searchText =
        issueSearch
          .toLowerCase()
          .trim();


      const matchesSearch =
        !searchText ||

        [
          row.serialLabel,
          row.sourceLabel,
          row.countName,
          row.tickitName,
          row.inwardDate
        ]
          .join(' ')
          .toLowerCase()
          .includes(
            searchText
          );


      const matchesType =
        issueTypeFilter ===
          'all' ||

        row.sourceType ===
          issueTypeFilter;


      return (
        matchesSearch &&
        matchesType
      );

    });


  /* =========================================================
     VALIDATE NUMBERS
  ========================================================= */

  const validateNumbers =
    () => {

      for (
        let i = 0;
        i < yarnLines.length;
        i++
      ) {

        const line =
          yarnLines[i];


        if (
          Number(
            line.givenBags ??
            line.bags ??
            0
          ) < 0
        ) {

          addToast(
            `Row #${i + 1}: Bags cannot be negative`,
            'error'
          );

          return false;

        }


        if (
          Number(
            line.cones || 0
          ) < 0
        ) {

          addToast(
            `Row #${i + 1}: Cone cannot be negative`,
            'error'
          );

          return false;

        }


        if (
          Number(
            line.weightKg || 0
          ) < 0
        ) {

          addToast(
            `Row #${i + 1}: Weight cannot be negative`,
            'error'
          );

          return false;

        }

      }


      if (
        header.totalEnds &&
        Number(
          header.totalEnds
        ) < 0
      ) {

        addToast(
          'Total Ends cannot be negative',
          'error'
        );

        return false;

      }


      if (
        header.cone &&
        Number(
          header.cone
        ) < 0
      ) {

        addToast(
          'Cone value cannot be negative',
          'error'
        );

        return false;

      }


      return true;

    };


  /* =========================================================
     REMOVE ALLOCATED YARN ROW
  ========================================================= */

  const removeAllocatedYarn = (lineKey) => {
    setYarnLines(prev =>
      prev.filter(line => line.key !== lineKey)
    );

    addToast(
      'Yarn allocation removed. The bags are available again.',
      'success'
    );
  };


  /* =========================================================
     SUBMIT
  ========================================================= */

  const handleSubmit =
    async event => {

      event.preventDefault();


      /*
       * Set number.
       */
      if (
        !header.setNo ||
        !header.setNo.trim()
      ) {

        addToast(
          'Set number is required',
          'error'
        );

        return;

      }


      /*
       * Must have at least one
       * Issue Yarn allocation.
       */
      if (
        yarnLines.length === 0
      ) {

        addToast(
          'Please select at least one yarn record from Issue Yarn',
          'error'
        );

        return;

      }


      if (
        !validateNumbers()
      ) {
        return;
      }


      /*
       * =====================================================
       * PAYLOAD
       * =====================================================
       */

      const payload = {

        setNo:
          header.setNo.trim(),

        setDate:
          header.setDate,

        outDate:
          header.setDate,

        orderId:
          toNumberOrNull(
            header.orderId
          ),

        partyId:
          toNumberOrNull(
            header.partyId
          ),

        quality:
          header.quality ||
          null,

        totalEnds:
          toNumberOrNull(
            header.totalEnds
          ),

        cone:
          toNumberOrNull(
            header.cone
          ),

        partNo:
          header.partNo ||
          null,

        sizingMtr:
          toNumberOrNull(
            header.sizingMtr
          ),

        /*
         * Count and Tickit are taken from the selected
         * Yarn Inward / Sizing Inward line.
         *
         * Do not send the header IDs here because the
         * header can contain a stale/manual ID.
         */
        countId:
          null,

        tickitId:
          null,

        /*
         * Total allocated bags.
         */
        bags:
          totals.bags ||
          null,

        /*
         * Total weight.
         */
        weightKg:
          totals.weightKg ||
          null,

        status:
          header.status ||
          'OPEN',


        /*
         * =================================================
         * YARN LINES
         *
         * IMPORTANT:
         *
         * givenBags is converted to backend "bags".
         *
         * The UI can call it Given Bags,
         * but backend receives bags.
         * =================================================
         */

        yarnLines:
          yarnLines.map(
            (line, index) => ({

              srNo:
                index + 1,

              countId:
                toNumberOrNull(
                  line.countId
                ),

              tickitId:
                toNumberOrNull(
                  line.tickitId
                ),

              /*
               * ACTUAL ALLOCATED QUANTITY
               */
              bags:
                toNumberOrNull(
                  line.givenBags ??
                  line.bags
                ),

              /*
               * Existing backend field.
               */
              cones:
                toNumberOrNull(
                  line.cones
                ),

              weightKg:
                toNumberOrNull(
                  line.weightKg
                ),

              weightPerBag:
                toNumberOrNull(
                  line.weightPerBag
                ),

              sourceFrom:
                line.sourceType === 'sizingIn'
                  ? 'Sizing'
                  : (line.sourceLabel || line.sourceFrom || null),

              freshWinding:
                line.type === 'USED'
                  ? 'Used'
                  : (
                    line.freshWinding ||
                    'Fresh'
                  ),

              remark:
                line.remark
                  ? line.remark.trim()
                  : null,

              /*
               * Yarn Inward relation.
               */
              yarnInwardId:
                toNumberOrNull(
                  line.yarnInwardId
                ),

              /*
               * Sizing Inward relation.
               *
               * If your backend DTO does not yet
               * have this field, add it there.
               */
              sizingInwardId:
                toNumberOrNull(
                  line.sizingInwardId
                )

            })
          )

      };


      setSaving(true);


      try {

        if (
          editingSet
        ) {

          await api.sizingSets.update(
            editingSet.sizingSetId,
            payload
          );


          addToast(
            'Sizing set updated successfully',
            'success'
          );

        } else {

          await api.sizingSets.create(
            payload
          );


          addToast(
            'Sizing set created successfully',
            'success'
          );

        }


        /*
         * Close editor.
         */
        setEditorOpen(false);

        setEditingSet(null);

        setYarnLines([]);


        /*
         * Reload saved data.
         */
        await fetchSizingSets();


      } catch (err) {

        addToast(
          err.message ||
            'Error saving sizing set',
          'error'
        );

      } finally {

        setSaving(false);

      }

    };


  /* =========================================================
     DELETE
  ========================================================= */

  const handleDelete =
    async sizingSet => {

      if (!sizingSet) {
        return;
      }


      const confirmed =
        window.confirm(
          `Are you sure you want to delete Sizing Set ${sizingSet.setNo}?`
        );


      if (!confirmed) {
        return;
      }


      try {

        await api.sizingSets.delete(
          sizingSet.sizingSetId
        );


        addToast(
          `Sizing set ${sizingSet.setNo} deleted`,
          'success'
        );


        await fetchSizingSets();


      } catch (err) {

        addToast(
          err.message ||
            'Failed to delete sizing set',
          'error'
        );

      }

    };


  /* =========================================================
     EDITOR VIEW
  ========================================================= */

  if (editorOpen) {

    return (
      <>
        {/* ===================================================
            ISSUE YARN MODAL
        =================================================== */}

        <Modal
          isOpen={
            issueModalOpen
          }
          onClose={() =>
            setIssueModalOpen(
              false
            )
          }
          title="Issue Yarn"
          size="lg"
        >

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}
          >

            {/* SEARCH */}

            <div
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'center',
                flexWrap: 'wrap'
              }}
            >

              <div
                className="search-box"
                style={{
                  flex: 1,
                  minWidth: 220
                }}
              >

                <Search size={16} />

                <input
                  type="text"
                  placeholder="Search by serial, count, tickit, date..."
                  value={
                    issueSearch
                  }
                  onChange={e =>
                    setIssueSearch(
                      e.target.value
                    )
                  }
                />

              </div>


              <select
                className="form-control"
                value={
                  issueTypeFilter
                }
                onChange={e =>
                  setIssueTypeFilter(
                    e.target.value
                  )
                }
                style={{
                  maxWidth: 180
                }}
              >

                <option value="all">
                  All Inward
                </option>

                <option value="yarnIn">
                  Yarn In
                </option>

                <option value="sizingIn">
                  Sizing In
                </option>

              </select>

            </div>


            {/* ISSUE TABLE */}

            <div
              className="table-responsive"
            >

              <table
                className="data-table"
              >

                <thead>

                  <tr>

                    <th
                      style={{
                        width: 45,
                        textAlign:
                          'center'
                      }}
                    >
                      Select
                    </th>

                    <th>
                      Serial
                    </th>

                    <th>
                      Type
                    </th>

                    <th>
                      Count
                    </th>

                    <th>
                      Tickit
                    </th>

                    <th>
                      Available Bags
                    </th>

                    <th>
                      Given Bags
                    </th>

                    <th>
                      Cone
                    </th>

                    <th>
                      Weight/Bag (Kg)
                    </th>

                    <th>
                      Weight (Kg)
                    </th>

                    <th>
                      Inward Date
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {loadingIssueRows ? (

                    <tr>

                      <td
                        colSpan="11"
                        style={{
                          textAlign:
                            'center',
                          padding:
                            '35px'
                        }}
                      >

                        <Loader2
                          size={22}
                          className="animate-spin"
                          style={{
                            margin:
                              '0 auto 8px'
                          }}
                        />

                        <div>
                          Loading available yarn...
                        </div>

                      </td>

                    </tr>

                  ) : filteredIssueRows.length === 0 ? (

                    <tr>

                      <td
                        colSpan="10"
                        style={{
                          textAlign:
                            'center',
                          padding:
                            '35px',
                          color:
                            'var(--text-muted)'
                        }}
                      >

                        <Package
                          size={28}
                          style={{
                            margin:
                              '0 auto 8px',
                            opacity: 0.4
                          }}
                        />

                        <div
                          style={{
                            fontWeight:
                              600
                          }}
                        >
                          No Yarn Available
                        </div>

                        <div
                          style={{
                            fontSize:
                              '0.8rem',
                            marginTop: 4
                          }}
                        >
                          All available yarn has
                          already been allocated.
                        </div>

                      </td>

                    </tr>

                  ) : (

                    filteredIssueRows.map(
                      row => (

                        <tr
                          key={
                            row.key
                          }
                        >

                          {/* SELECT */}

                          <td
                            style={{
                              textAlign:
                                'center'
                            }}
                          >

                            <input
                              type="checkbox"
                              checked={
                                row.checked
                              }
                              onChange={e =>
                                toggleIssueRow(
                                  row.key,
                                  e.target.checked
                                )
                              }
                            />

                          </td>


                          {/* SERIAL */}

                          <td
                            style={{
                              fontWeight:
                                700,
                              color:
                                'var(--primary-blue-dark)'
                            }}
                          >
                            {
                              row.serialLabel
                            }
                          </td>


                          {/* TYPE */}

                          <td>
                            <span className={`badge ${row.type === 'USED' ? 'badge-warning' : 'badge-success'}`}>
                              {row.type || 'FRESH'}
                            </span>
                          </td>


                          {/* COUNT */}

                          <td>
                            {
                              row.countName ||
                              '-'
                            }
                          </td>


                          {/* TICKIT */}

                          <td>
                            {
                              row.tickitName ||
                              '-'
                            }
                          </td>


                          {/* AVAILABLE */}

                          <td
                            style={{
                              fontWeight:
                                700,
                              textAlign:
                                'right'
                            }}
                          >
                            {
                              row.remainingBags
                            }
                          </td>


                          {/* GIVEN */}

                          <td>

                            <input
                              type="number"
                              min="0"
                              max={
                                row.remainingBags
                              }
                              step="1"
                              className="form-control"
                              value={
                                row.issueBags
                              }
                              disabled={
                                !row.checked
                              }
                              onChange={e =>
                                updateIssueRowBag(
                                  row.key,
                                  e.target.value
                                )
                              }
                              placeholder={
                                String(
                                  row.remainingBags
                                )
                              }
                            />

                          </td>


                          {/* CONE */}

                          <td>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              className="form-control"
                              value={
                                row.issueCones ?? ''
                              }
                              disabled={
                                !row.checked
                              }
                              onChange={e =>
                                updateIssueRowCone(
                                  row.key,
                                  e.target.value
                                )
                              }
                              placeholder="Cone"
                            />
                          </td>


                          {/* WEIGHT PER BAG */}

                          <td
                            style={{
                              textAlign: 'right',
                              fontWeight: 600
                            }}
                          >
                            {Number(row.weightPerBag || 0).toFixed(2)}
                          </td>


                          {/* WEIGHT */}

                          <td
                            style={{
                              textAlign:
                                'right',
                              fontWeight: 600
                            }}
                          >
                            {(() => {
                              const bags = Number(row.issueBags || 0);
                              const wpb = Number(row.weightPerBag || 0);
                              const weight = bags * wpb;
                              return Number.isFinite(weight) ? weight.toFixed(2) : '0.00';
                            })()}
                          </td>


                          {/* DATE */}

                          <td>
                            {
                              row.inwardDate ||
                              '-'
                            }
                          </td>

                        </tr>

                      )
                    )

                  )}

                </tbody>

              </table>

            </div>


            {/* DONE */}

            <div
              style={{
                display:
                  'flex',
                justifyContent:
                  'flex-end',
                marginTop: 12
              }}
            >

              <button
                type="button"
                className="btn btn-primary"
                onClick={
                  handleIssueDone
                }
              >

                <CheckCircle2
                  size={16}
                />

                <span>
                  Done
                </span>

              </button>

            </div>

          </div>

        </Modal>


        {/* ===================================================
            MAIN EDITOR
        =================================================== */}

        <div
          className="content-area"
        >

          <form
            onSubmit={
              handleSubmit
            }
          >

            {/* =================================================
                HEADER CARD
            ================================================= */}

            <div
              className="section-card"
            >

              <div
                className="section-card-header"
              >

                <div
                  className="section-card-title"
                >

                  <Layers
                    size={22}
                    color="var(--primary-blue)"
                  />

                  <div>

                    <h3
                      style={{
                        margin: 0,
                        fontSize:
                          '1.15rem',
                        fontWeight:
                          700
                      }}
                    >
                      {editingSet
                        ? `Edit Sizing Set: ${header.setNo}`
                        : 'Create Sizing Set'}
                    </h3>

                    <span
                      style={{
                        fontSize:
                          '0.8rem',
                        color:
                          'var(--text-muted)'
                      }}
                    >
                      Set metadata & order construction specification
                    </span>

                  </div>

                </div>


                <div
                  className="section-card-actions"
                >

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={
                      openIssueYarnSelection
                    }
                  >

                    <Package
                      size={16}
                    />

                    <span>
                      Issue Yarn
                    </span>

                  </button>


                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() =>
                      setEditorOpen(
                        false
                      )
                    }
                  >

                    <ArrowLeft
                      size={16}
                    />

                    <span>
                      Cancel / Back
                    </span>

                  </button>


                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={
                      saving
                    }
                  >

                    {saving ? (

                      <>
                        <Loader2
                          size={16}
                          className="animate-spin"
                        />

                        <span>
                          Saving...
                        </span>
                      </>

                    ) : (

                      <>
                        <CheckCircle2
                          size={16}
                        />

                        <span>
                          {editingSet
                            ? 'Update Sizing Set'
                            : 'Save Sizing Set'}
                        </span>
                      </>

                    )}

                  </button>

                </div>

              </div>


              {/* HEADER FIELDS */}

              <div
                className="form-grid-4"
                style={{
                  marginTop:
                    '12px'
                }}
              >

                {/* SET NO */}

                <div
                  className="form-group"
                >

                  <label>
                    <Hash
                      size={13}
                      color="var(--primary-blue)"
                    />

                    <span>
                      Set No
                    </span>
                  </label>

                  <input
                    type="text"
                    className="form-control"
                    value={
                      header.setNo
                    }
                    onChange={e =>
                      updateHeader(
                        'setNo',
                        e.target.value
                      )
                    }
                    placeholder="e.g. SET-0001"
                    style={{
                      fontWeight:
                        600,
                      color:
                        'var(--primary-blue-dark)'
                    }}
                  />

                </div>


                {/* ORDER */}

                <div
                  className="form-group"
                >

                  <label>

                    <FileText
                      size={13}
                      color="var(--primary-blue)"
                    />

                    <span>
                      Order No
                    </span>

                    {loadingOrderDetails && (
                      <Loader2
                        size={13}
                        className="animate-spin"
                        color="var(--primary-blue)"
                      />
                    )}

                  </label>


                  <select
                    className="form-control"
                    value={
                      header.orderNo
                    }
                    onChange={e =>
                      handleOrderChange(
                        e.target.value
                      )
                    }
                  >

                    <option value="">
                      -- Select Order --
                    </option>


                    {header.orderNo &&
                      !openOrders.some(
                        o =>
                          o.orderNo ===
                          header.orderNo
                      ) && (

                        <option
                          value={
                            header.orderNo
                          }
                        >
                          {
                            header.orderNo
                          }
                        </option>

                      )}


                    {openOrders.map(
                      order => (

                        <option
                          key={
                            order.orderId
                          }
                          value={
                            order.orderNo
                          }
                        >
                          {
                            order.orderNo
                          }{' '}
                          {
                            order.party
                              ?.partyName
                              ? `(${order.party.partyName})`
                              : ''
                          }
                        </option>

                      )
                    )}

                  </select>

                </div>


                {/* DATE */}

                <div
                  className="form-group"
                >

                  <label>

                    <Calendar
                      size={13}
                      color="var(--primary-blue)"
                    />

                    <span>
                      Date
                    </span>

                  </label>


                  <input
                    type="date"
                    className="form-control"
                    value={
                      header.setDate
                    }
                    onChange={e =>
                      updateHeader(
                        'setDate',
                        e.target.value
                      )
                    }
                    required
                  />

                </div>


                {/* PARTY */}

                <div
                  className="form-group"
                >

                  <label>

                    <Building2
                      size={13}
                      color="var(--text-muted)"
                    />

                    <span>
                      Party / Customer
                    </span>

                  </label>


                  <input
                    type="text"
                    className="form-control"
                    value={
                      header.firmName
                    }
                    onChange={e =>
                      updateHeader(
                        'firmName',
                        e.target.value
                      )
                    }
                    placeholder="Auto-filled from order"
                  />

                </div>


                {/* QUALITY */}

                <div
                  className="form-group"
                >

                  <label>

                    <Tag
                      size={13}
                      color="var(--text-muted)"
                    />

                    <span>
                      Quality
                    </span>

                  </label>


                  <input
                    type="text"
                    className="form-control"
                    value={
                      header.quality
                    }
                    onChange={e =>
                      updateHeader(
                        'quality',
                        e.target.value
                      )
                    }
                    placeholder="Auto-filled from order"
                  />

                </div>


                {/* TOTAL ENDS */}

                <div
                  className="form-group"
                >

                  <label>
                    Total Ends
                  </label>


                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    value={
                      header.totalEnds
                    }
                    onChange={e =>
                      updateHeader(
                        'totalEnds',
                        e.target.value
                      )
                    }
                    placeholder="e.g. 7000"
                  />

                </div>


                {/* CONE */}

                <div
                  className="form-group"
                >

                  <label>
                    Target / Cone
                  </label>


                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    className="form-control"
                    value={
                      header.cone
                    }
                    onChange={e =>
                      updateHeader(
                        'cone',
                        e.target.value
                      )
                    }
                    placeholder="e.g. 24"
                  />

                </div>


                {/* PART */}

                <div
                  className="form-group"
                >

                  <label>
                    Part
                  </label>


                  <input
                    type="text"
                    className="form-control"
                    value={
                      header.partNo
                    }
                    onChange={e =>
                      updateHeader(
                        'partNo',
                        e.target.value
                      )
                    }
                    placeholder="e.g. Part 1"
                  />

                </div>


                {/* SIZING METER */}

                <div
                  className="form-group"
                >

                  <label>
                    Sizing Meter
                  </label>


                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    className="form-control"
                    value={
                      header.sizingMtr
                    }
                    onChange={e =>
                      updateHeader(
                        'sizingMtr',
                        e.target.value
                      )
                    }
                    placeholder="e.g. 120.5"
                  />

                </div>

              </div>

            </div>


            {/* =================================================
                YARN ALLOCATION
            ================================================= */}

            <div
              className="section-card"
              style={{
                marginTop: 20
              }}
            >

              <div
                className="section-card-header"
              >

                <div
                  className="section-card-title"
                >

                  <Package
                    size={20}
                    color="var(--primary-blue)"
                  />

                  <div>

                    <h3
                      style={{
                        margin: 0,
                        fontSize:
                          '1.05rem',
                        fontWeight:
                          700
                      }}
                    >
                      Yarn Allocation Records
                    </h3>

                    <span
                      style={{
                        fontSize:
                          '0.8rem',
                        color:
                          'var(--text-muted)'
                      }}
                    >
                      Selected rows from Issue Yarn — Read Only
                    </span>

                  </div>


                  <span
                    className="badge badge-info"
                    style={{
                      marginLeft: 8
                    }}
                  >
                    {
                      yarnLines.length
                    }{' '}
                    {
                      yarnLines.length ===
                      1
                        ? 'Row'
                        : 'Rows'
                    }
                  </span>

                </div>

              </div>


              {/* ALLOCATION TABLE */}

              <div
                className="table-responsive"
                style={{
                  overflowX:
                    'auto',
                  marginTop:
                    12
                }}
              >

                <table
                  className="data-table"
                >

                  <thead>

                    <tr>

                      <th>
                        Sr No
                      </th>

                      <th>
                        Serial
                      </th>

                      <th>
                        Type
                      </th>

                      <th>
                        Count
                      </th>

                      <th>
                        Tickit
                      </th>

                      <th>
                        Available Bags
                      </th>

                      <th>
                        Given Bags
                      </th>

                      <th>
                        Cone
                      </th>

                      <th>
                        Weight (Kg)
                      </th>

                      <th>
                        Inward Date
                      </th>

                      <th>
                        Action
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {yarnLines.length ===
                    0 ? (

                      <tr>

                        <td
                          colSpan="10"
                          style={{
                            textAlign:
                              'center',
                            padding:
                              '35px',
                            color:
                              'var(--text-muted)'
                          }}
                        >

                          <Package
                            size={28}
                            style={{
                              margin:
                                '0 auto 8px',
                              opacity:
                                0.4
                            }}
                          />

                          <div
                            style={{
                              fontWeight:
                                600
                            }}
                          >
                            No Yarn Allocated
                          </div>

                          <div
                            style={{
                              fontSize:
                                '0.8rem',
                              marginTop:
                                4
                            }}
                          >
                            Click "Issue Yarn"
                            and select
                            inward records.
                          </div>

                        </td>

                      </tr>

                    ) : (

                      yarnLines.map(
                        (
                          line,
                          index
                        ) => (

                          <tr
                            key={
                              line.key
                            }
                          >

                            {/* SR NO */}

                            <td
                              style={{
                                textAlign:
                                  'center',
                                fontWeight:
                                  600,
                                color:
                                  'var(--text-muted)'
                              }}
                            >
                              {index + 1}
                            </td>


                            {/* SERIAL */}

                            <td
                              style={{
                                fontWeight:
                                  700,
                                color:
                                  'var(--primary-blue-dark)'
                              }}
                            >
                              {
                                line.serialLabel ||
                                '-'
                              }
                            </td>


                            {/* TYPE */}

                            <td>
                              <span className={`badge ${line.type === 'USED' ? 'badge-warning' : 'badge-success'}`}>
                                {line.type || line.sourceLabel || 'FRESH'}
                              </span>
                            </td>


                            {/* COUNT */}

                            <td>
                              {
                                line.countName ||
                                line.countId ||
                                '-'
                              }
                            </td>


                            {/* TICKIT */}

                            <td>
                              {
                                line.tickitName ||
                                line.tickitId ||
                                '-'
                              }
                            </td>


                            {/* AVAILABLE */}

                            <td
                              style={{
                                textAlign:
                                  'right',
                                fontWeight:
                                  600
                              }}
                            >
                              {
                                line.availableBags ??
                                0
                              }
                            </td>


                            {/* GIVEN */}

                            <td
                              style={{
                                textAlign:
                                  'right',
                                fontWeight:
                                  700,
                                color:
                                  'var(--primary-blue-dark)'
                              }}
                            >
                              {
                                line.givenBags ??
                                0
                              }
                            </td>


                            {/* CONE */}

                            <td
                              style={{
                                textAlign:
                                  'right',
                                fontWeight:
                                  600
                              }}
                            >
                              {Number(
                                line.cones ||
                                0
                              )}
                            </td>


                            {/* WEIGHT */}

                            <td
                              style={{
                                textAlign:
                                  'right',
                                fontWeight:
                                  600
                              }}
                            >
                              {Number(
                                line.weightKg ||
                                0
                              ).toFixed(
                                2
                              )}
                            </td>


                            {/* DATE */}

                            <td>
                              {
                                line.inwardDate ||
                                '-'
                              }
                            </td>

                            {/* DELETE */}
                            <td
                              style={{
                                textAlign: 'center'
                              }}
                            >
                              <button
                                type="button"
                                className="btn btn-sm btn-danger"
                                title="Remove this allocated yarn"
                                onClick={() =>
                                  removeAllocatedYarn(
                                    line.key
                                  )
                                }
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  padding: '6px 9px'
                                }}
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>

                          </tr>

                        )
                      )

                    )}

                  </tbody>


                  {/* TOTAL */}

                  <tfoot>

                    <tr
                      className="table-totals-row"
                    >

                      <td
                        colSpan="5"
                        style={{
                          textAlign:
                            'right',
                          paddingRight:
                            '16px'
                        }}
                      >
                        TOTAL
                      </td>


                      <td
                        style={{
                          textAlign:
                            'right',
                          fontWeight:
                            700
                        }}
                      >
                        {
                          yarnLines.reduce(
                            (
                              sum,
                              line
                            ) =>
                              sum +
                              Number(
                                line.availableBags ||
                                0
                              ),
                            0
                          )
                        }
                      </td>


                      <td
                        style={{
                          textAlign:
                            'right',
                          fontWeight:
                            700,
                          color:
                            'var(--primary-blue-dark)'
                        }}
                      >
                        {
                          yarnLines.reduce(
                            (
                              sum,
                              line
                            ) =>
                              sum +
                              Number(
                                line.givenBags ||
                                0
                              ),
                            0
                          )
                        }
                      </td>


                      <td
                        style={{
                          textAlign:
                            'right',
                          fontWeight:
                            700
                        }}
                      >
                        {
                          yarnLines.reduce(
                            (sum, line) =>
                              sum + Number(line.cones || 0),
                            0
                          )
                        }
                      </td>


                      <td
                        style={{
                          textAlign:
                            'right',
                          fontWeight:
                            700
                        }}
                      >
                        {
                          yarnLines
                            .reduce(
                              (
                                sum,
                                line
                              ) =>
                                sum +
                                Number(
                                  line.weightKg ||
                                  0
                                ),
                              0
                            )
                            .toFixed(
                              2
                            )
                        }{' '}
                        kg
                      </td>


                      <td />

                    </tr>

                  </tfoot>

                </table>

              </div>

            </div>

          </form>

        </div>

      </>
    );
  }


  /* =========================================================
     LIST VIEW
  ========================================================= */

  return (

    <div
      className="content-area"
    >

      <div
        className="section-card"
      >

        {/* HEADER */}

        <div
          className="section-card-header"
        >

          <div
            className="section-card-title"
          >

            <Layers
              size={22}
              color="var(--primary-blue)"
            />

            <div>

              <h3
                style={{
                  margin: 0,
                  fontSize:
                    '1.2rem',
                  fontWeight:
                    700
                }}
              >
                Sizing Sets
              </h3>

              <span
                style={{
                  fontSize:
                    '0.8rem',
                  color:
                    'var(--text-muted)'
                }}
              >
                Overview of active sizing batches and allocations
              </span>

            </div>


            <span
              className="badge badge-info"
              style={{
                marginLeft: 8
              }}
            >
              {
                filteredSets.length
              }{' '}
              {
                filteredSets.length ===
                1
                  ? 'Record'
                  : 'Records'
              }
            </span>

          </div>


          <div
            className="section-card-actions"
          >

            <div
              className="search-box"
            >

              <Search
                size={16}
              />

              <input
                type="text"
                placeholder="Search set, order, party..."
                value={
                  search
                }
                onChange={e =>
                  setSearch(
                    e.target.value
                  )
                }
              />

            </div>

            <button
              className="btn btn-primary"
              onClick={openCreateEditor}
            >
              <Plus size={18} />
              <span>New Sizing Set</span>
            </button>
          </div>
        </div>

        {/* LIST TABLE */}

        <div
          className="table-responsive"
        >

          <table
            className="data-table"
          >

            <thead>

              <tr>

                <th>
                  Set No
                </th>

                <th>
                  Date
                </th>

                <th>
                  Order No
                </th>

                <th>
                  Firm / Customer
                </th>

                <th>
                  Quality
                </th>

                <th>
                  Part
                </th>

                <th
                  style={{
                    textAlign:
                      'center'
                  }}
                >
                  Yarn Rows
                </th>

                <th
                  style={{
                    textAlign:
                      'right'
                  }}
                >
                  Total Bags
                </th>

                <th
                  style={{
                    textAlign:
                      'right'
                  }}
                >
                  Total Weight
                </th>

                <th>
                  Status
                </th>

                <th
                  style={{
                    textAlign:
                      'right'
                  }}
                >
                  Actions
                </th>

              </tr>

            </thead>


            <tbody>

              {loadingSets ? (

                <tr>

                  <td
                    colSpan="11"
                    style={{
                      textAlign:
                        'center',
                      padding:
                        '40px'
                    }}
                  >

                    <Loader2
                      size={20}
                      className="animate-spin"
                      style={{
                        margin:
                          '0 auto 8px'
                      }}
                    />

                    Loading sizing sets...

                  </td>

                </tr>

              ) : filteredSets.length ===
                0 ? (

                <tr>

                  <td
                    colSpan="11"
                    style={{
                      textAlign:
                        'center',
                      padding:
                        '48px 24px',
                      color:
                        'var(--text-dim)'
                    }}
                  >

                    <Layers
                      size={36}
                      style={{
                        margin:
                          '0 auto 12px',
                        opacity:
                          0.3
                      }}
                    />

                    <p
                      style={{
                        fontWeight:
                          600,
                        marginBottom:
                          4
                      }}
                    >
                      No Sizing Sets Found
                    </p>

                    <p
                      style={{
                        fontSize:
                          '0.85rem'
                      }}
                    >
                      {
                        search
                          ? 'Try adjusting your search query'
                          : 'Create your first sizing set using the button above'
                      }
                    </p>

                  </td>

                </tr>

              ) : (

                filteredSets.map(
                  item => {

                    const lineCount =
                      Array.isArray(
                        item.yarnLines
                      )
                        ? item.yarnLines.length
                        : 0;


                    const totalLineBags =
                      Array.isArray(
                        item.yarnLines
                      )
                        ? item.yarnLines.reduce(
                            (
                              acc,
                              line
                            ) =>
                              acc +
                              Number(
                                line.givenBags ??
                                line.bags ??
                                0
                              ),
                            0
                          )
                        : Number(
                            item.bags ||
                            0
                          );


                    const totalLineWeight =
                      Array.isArray(
                        item.yarnLines
                      )
                        ? item.yarnLines.reduce(
                            (
                              acc,
                              line
                            ) =>
                              acc +
                              Number(
                                line.weightKg ||
                                0
                              ),
                            0
                          )
                        : Number(
                            item.weightKg ||
                            0
                          );


                    return (

                      <tr
                        key={
                          item.sizingSetId
                        }
                      >

                        <td
                          style={{
                            fontWeight:
                              700,
                            color:
                              'var(--primary-blue-dark)'
                          }}
                        >
                          {
                            item.setNo
                          }
                        </td>


                        <td>
                          {
                            formatDate(
                              item.setDate ||
                              item.outDate
                            ) || '-'
                          }
                        </td>


                        <td
                          style={{
                            fontWeight:
                              600
                          }}
                        >
                          {
                            item.order
                              ?.orderNo ||
                            '-'
                          }
                        </td>


                        <td>
                          {
                            item.party
                              ?.partyName ||
                            item.order
                              ?.party
                              ?.partyName ||
                            '-'
                          }
                        </td>


                        <td>
                          {
                            item.quality ||
                            item.order
                              ?.quality ||
                            '-'
                          }
                        </td>


                        <td>

                          <span
                            className="badge badge-subtle"
                          >
                            {
                              item.partNo ||
                              'Part 1'
                            }
                          </span>

                        </td>


                        <td
                          style={{
                            textAlign:
                              'center'
                          }}
                        >

                          <span
                            className="badge badge-info"
                          >
                            {
                              lineCount
                            }{' '}
                            {
                              lineCount ===
                              1
                                ? 'line'
                                : 'lines'
                            }
                          </span>

                        </td>


                        <td
                          style={{
                            textAlign:
                              'right'
                          }}
                        >
                          {
                            totalLineBags
                          }
                        </td>


                        <td
                          style={{
                            textAlign:
                              'right',
                            fontWeight:
                              600
                          }}
                        >
                          {
                            totalLineWeight >
                            0
                              ? `${totalLineWeight.toFixed(
                                  2
                                )} kg`
                              : '-'
                          }
                        </td>


                        <td>

                          <span
                            className={`badge ${
                              item.status ===
                              'COMPLETED'
                                ? 'badge-success'
                                : 'badge-warning'
                            }`}
                          >
                            {
                              item.status ||
                              'OPEN'
                            }
                          </span>

                        </td>


                        <td
                          style={{
                            textAlign:
                              'right'
                          }}
                        >

                          <div
                            style={{
                              display:
                                'flex',
                              justifyContent:
                                'flex-end',
                              gap: 6
                            }}
                          >

                            <button
                              className="btn-icon"
                              onClick={() =>
                                openEditEditor(
                                  item
                                )
                              }
                              title="Edit Sizing Set"
                            >

                              <Edit2
                                size={15}
                              />

                            </button>


                            <button
                              className="btn-icon"
                              style={{
                                color:
                                  'var(--color-danger)'
                              }}
                              onClick={() =>
                                handleDelete(
                                  item
                                )
                              }
                              title="Delete Sizing Set"
                            >

                              <Trash2
                                size={15}
                              />

                            </button>

                          </div>

                        </td>

                      </tr>

                    );

                  }
                )

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>

  );
};