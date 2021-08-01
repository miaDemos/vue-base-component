<script>
import { isFunction, debounce, isEqual } from "lodash";

import BaseFilter from "../BaseFilter";
import BaseTable from "../BaseTable";

export default {
  name: "BaseList",
  props: {
    api: {
      type: Function,
      default: async () => {
        // noop
      },
    },
    filters: {
      type: Array,
      default: () => [],
    },
    columns: {
      type: Array,
      default: () => [],
    },
    filterStyle: {
      type: String,
      default: "",
    },
    noPagination: {
      type: Boolean,
      default: false,
    },
    needLoading: {
      type: Boolean,
      default: true,
    },
    itemKey: {
      type: String,
      default: "items",
    },
  },
  data() {
    return {
      filterValue: {},
      data: [],
      loading: false,
      requestNumber: 0,
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0,
      },
      debouncedFilterChange: debounce(this.handleFilterChange, 150),
    };
  },
  computed: {
    validFilters() {
      return this.filters.filter((item) => !!item);
    },
  },
  watch: {
    api: {
      immediate: true,
      handler() {
        // 更改查询方法后，查询页码应该重置为第一页
        this.pagination.currentPage = 1;
        this.fetchList();
      },
    },
  },
  beforeDestroy() {
    this.debouncedFilterChange.cancel();
  },
  methods: {
    async fetchList() {
      try {
        if (!isFunction(this.api)) return;

        let currentNumber = ++this.requestNumber;
        this.loading = true;
        const { currentPage, pageSize } = this.pagination;
        const { data } = await this.api(this.filterValue, {
          page: currentPage,
          limit: pageSize,
        });

        if (currentNumber === this.requestNumber) {
          this.data = data[this.itemKey];
          this.pagination.total = data.total;
        }
      } catch (err) {
        this.$message.error(err.message || "请求数据失败");
      } finally {
        this.loading = false;
      }
    },
    handleFilterChange(value) {
      if (isEqual(value, this.filterValue)) return;

      this.filterValue = value;
      // 更改筛选条件后，查询页码应该重置为第一页
      this.pagination.currentPage = 1;
      this.fetchList();
    },
    handlePageChange(currentPage) {
      this.pagination.currentPage = currentPage;
      this.fetchList();
      console.log("change");
    },
    handlePageSizeChange(pageSize) {
      this.pagination.pageSize = pageSize;
      this.fetchList();
    },

    /** ==== 可外部调用 API START ==== */
    // 重新查询列表
    freshList() {
      this.fetchList();
    },
    // 对外接口，外部修改筛选表单值
    setFilterValue(key, val) {
      if (Object.prototype.hasOwnProperty.call(this.filterValue, key)) {
        this.filterValue[key] = val;
      } else {
        this.$set(this.filterValue, key, val);
      }
    },
    /** ==== 可外部调用 API END ==== */
  },
  render(h) {
    const {
      needLoading,
      loading,
      data,
      columns,
      filterValue,
      noPagination,

      pagination,
      $scopedSlots,
      $slots,
    } = this;

    return (
      <div>
        <BaseFilter
          filterStyle={this.filterStyle}
          value={filterValue}
          filters={this.validFilters}
          on={{
            input: (value) => {
              // 筛选项内可能有 input, change 过于频繁，此处做防抖处理
              this.debouncedFilterChange(value);
              this.$emit("filterChange", value);
            },
          }}
          scopedSlots={$scopedSlots}
        >
          {Object.keys($slots).map((value) => (
            <div slot={value}>{h("div", $slots[value])}</div>
          ))}
        </BaseFilter>

        <div class="content-container">
          <div
            v-loading={needLoading && loading}
            class="list-content"
            style={{
              minHeight: needLoading && loading ? "100px" : "", // loading时加一个最小高度
            }}
          >
            <slot data={data} form={filterValue}>
              <BaseTable
                max-height={500}
                data={data}
                columns={columns}
              ></BaseTable>
            </slot>
          </div>
          {!noPagination && (
            <el-pagination
              currentPage={pagination.currentPage}
              pageSize={pagination.pageSize}
              total={pagination.total}
              layout="total, prev, pager, sizes, next"
              style="text-align: right; margin-top: 16px;"
              on={{
                "current-change": this.handlePageChange,
                "size-change": this.handlePageSizeChange,
              }}
            ></el-pagination>
          )}
        </div>
      </div>
    );
  },
};
</script>
<style lang="scss" scoped></style>
