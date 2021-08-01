<script>
export default {
  name: "BaseTable",
  inheritAttrs: false,
  props: {
    data: {
      type: Array,
      default: () => [],
    },
    /** 渲染 table 列的数据 */
    columns: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {};
  },
  render() {
    const { data, $attrs, $listeners } = this;

    return (
      <el-table
        ref="table"
        class="base-table"
        data={data}
        {...{ attrs: $attrs, on: $listeners }}
      >
        {this.columns.map((column) => {
          const { prop, render, ...restProps } = column;

          return (
            <el-table-column
              attrs={restProps}
              scopedSlots={
                render
                  ? {
                      default: (...args) => render(...args),
                    }
                  : {}
              }
              prop={prop}
              key={prop}
            ></el-table-column>
          );
        })}
      </el-table>
    );
  },
};
</script>

<style lang="less" scoped></style>
