<template>
  <div class="list-filter" :style="filterStyle">
    <div v-if="!filters.length && !$slots.btnContainer" class="filter-slot">
      <slot name="filter"></slot>
    </div>
    <el-form
      v-else
      :model="filterValue"
      class="form-response"
      status-icon
      @submit.native.prevent
    >
      <el-row
        :gutter="16"
        :class="
          $slots.btnContainer || $scopedSlots.btnContainer
            ? [
                'clearfix',
                'btn-container',
                `btn-container-${filtersWithComp.length}`,
              ]
            : []
        "
      >
        <div
          v-if="$slots.btnContainer || $scopedSlots.btnContainer"
          :class="[
            'btn-wrapper' /* ,filtersWithComp.length>3?'btn-wrapper-border':'' */,
          ]"
        >
          <slot name="btnContainer" :form="filterValue"> </slot>
        </div>
        <!-- 筛选项等于 2 个，重置按钮前置 -->
        <!-- 只有一个筛选项不展示重置按钮 -->
        <div
          v-if="filtersWithComp.length === 2"
          class="reset-btn expand-wrapper"
        >
          <el-button @click="resetfilterValuePrivate">重置</el-button>
        </div>
        <div
          class="clearfix"
          :class="{
            'only-filter': !($slots.btnContainer || $scopedSlots.btnContainer),
          }"
        >
          <!-- filter 配置项可选入 col 配置 el-col 的宽度。传入 expandIgnore: true, 则不会被展开/收起按钮影响，但此类筛选项一定要在 filters 内置前 -->
          <template v-for="(filter, index) in filtersWithComp">
            <el-col
              v-show="index - expandIgnoreLength < 3 || isExpand"
              :key="index"
              v-bind="{ ...responseValue, ...(filter.col || {}) }"
              class="filter-item"
            >
              <el-form-item
                :label="filter.label"
                :prop="filter.prop"
                :label-width="getFilterItemLabeiWidth(filter)"
              >
                <component
                  :is="filter._component"
                  v-model="filterValue[filter.prop]"
                  size="medium"
                ></component>
              </el-form-item>
            </el-col>
          </template>
          <el-col
            v-if="filtersWithComp.length > 2"
            class="reset-btn expand-wrapper"
            v-bind="responseValue"
          >
            <el-button @click="resetfilterValuePrivate">重置</el-button>
            <div
              v-if="filtersWithComp.length - expandIgnoreLength > 3"
              class="expand-btn"
              @click="isExpand = !isExpand"
            >
              <span>{{ isExpand ? "收起" : "展开" }}</span>
              <i
                :class="isExpand ? 'el-icon-caret-top' : 'el-icon-caret-bottom'"
              ></i>
            </div>
          </el-col>
        </div>
      </el-row>
    </el-form>
  </div>
</template>
<script>
import HOC from "@/utils/hoc.js";
import { isEmpty, cloneDeep, isEqual, omit } from "lodash";
export default {
  name: "FilterList",
  props: {
    filters: {
      type: Array,
      default: () => [],
    },
    filterStyle: {
      type: String,
      default: "",
    },
    value: {
      type: Object,
      default: () => ({}),
    },
    defaultValue: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      isExpand: false,
      responseValue: {
        xs: 24,
        sm: 12,
        md: 8,
        lg: 6,
      },
      filterValue: cloneDeep(this.value),
    };
  },
  computed: {
    filtersWithComp() {
      return this.filters.map((f) => {
        f._component = this.getComp(f);
        return f;
      });
    },
    expandIgnoreLength() {
      return this.filters.filter(({ expandIgnore }) => expandIgnore).length;
    },
  },
  watch: {
    filterValue: {
      handler: function (val, old) {
        this.$emit("input", cloneDeep(val));
      },
      deep: true,
    },
    value: {
      deep: true,
      handler: function (val, old) {
        if (isEqual(this.filterValue, val)) return;
        this.filterValue = cloneDeep(val);
      },
    },
  },
  methods: {
    getFilterItemLabeiWidth({ labelWidth, width }) {
      if (Number.isFinite(parseFloat(labelWidth))) {
        return labelWidth + "px";
      }
      if (Number.isFinite(parseFloat(width))) {
        return width + "px";
      }

      return "72px";
    },
    resetfilterValuePrivate() {
      // this.filters.map(f => {
      //   // todo 默认字段不能清空
      //   this.filterValue[f.prop] = ''
      // })
      this.filterValue = cloneDeep(this.defaultValue);
    },
    getComp(filter) {
      const {
        component,
        clearable = true,
        ...otherProps
      } = omit(filter, ["label", "prop", "col"]);

      const props = {
        ...otherProps,
        clearable,
      };

      if (!component) return "div";

      if (!isEmpty(props)) {
        return HOC(component, props);
      }

      return component;
    },
  },
};
</script>
<style lang="less" scoped>
.filter-slot {
  margin-bottom: 16px;
}

.list-filter {
  // padding-top: 16px;
  .el-row {
    margin-left: 0 !important;
    margin-right: 0 !important;
  }
}

.form-response {
  line-height: 2;

  .el-col-item {
    margin-bottom: 16px;
  }
}

/deep/ .list-content {
  min-height: 300px;
}

// 暂不考虑错误显示，参照设计稿
.el-form-item--feedback {
  margin-bottom: 0;
}

.list-pagination {
  text-align: right;
}

.base-list-action {
  margin-bottom: 16px;
  float: right;
  text-align: right;
}

.btn-container {
  &-1,
  &-2,
  &-3 {
    .reset-btn {
      float: right !important;

      .el-button {
        float: right;
      }
    }
  }

  .btn-wrapper {
    padding: 16px 0 16px;

    /deep/ .el-button {
      > span {
        i {
          font-size: 14px;
          color: #fff;
          margin-right: 0;
          vertical-align: middle;
        }

        span {
          vertical-align: middle;
        }
      }
    }
  }
}

.expand-wrapper {
  float: right;
  text-align: right;
  padding-bottom: 16px;
}

.expand-btn {
  cursor: pointer;
  display: inline-block;
  margin-left: 16px;

  span {
    color: #71c7ad;
  }

  i {
    color: #71c7ad;
  }
}

.only-filter {
  // margin-top: 16px;
  margin-left: -8px;
  margin-right: -8px;
}

.btn-wrapper-border {
  border-bottom: 1px dashed #f0f2f5;
}

.filter-item {
  padding-bottom: 16px;
}

.btn-wrapper {
  font-size: 0;
}
// 筛选响应式布局
@media (max-width: 767px) {
  .btn-wrapper {
    float: left;
    width: 100%;
    box-sizing: border-box;
    padding: 0 16px;
  }

  .filter-item {
    width: 100%;
    float: right;
  }

  .reset-btn {
    float: right;
    width: 180px;
    padding-bottom: 8px;
    padding-left: 0;
    margin-top: 16px;
  }
}

@media (min-width: 768px) and (max-width: 992px) {
  .btn-container-1 {
    .btn-wrapper {
      float: left;
      width: 50%;
      box-sizing: border-box;
    }

    .filter-item {
      padding-top: 16px;
      float: right;
      width: 50%;
      box-sizing: border-box;
    }
  }

  .btn-container-2 {
    .btn-wrapper {
      width: 100%;
      box-sizing: border-box;
      float: left;
    }

    .filter-item {
      float: left;
      width: calc((100% - 100px) / 2);
      box-sizing: border-box;
    }

    .reset-btn {
      float: right;
      // margin-right: 16px;
      width: 70px;
      text-align: right;
    }
  }

  .btn-container-3 {
    .btn-wrapper {
      width: 100%;
      box-sizing: border-box;
      float: left;
    }

    .filter-item {
      &:first-of-type {
        padding-left: 0 !important;
      }

      float: left;
      width: calc(50%);
      box-sizing: border-box;
    }

    .reset-btn {
      float: left;
      padding-right: 8px;
      box-sizing: border-box;
      width: 50%;
      text-align: right;
    }
  }
}

@media (min-width: 993px) and (max-width: 1200px) {
  .btn-container-1 {
    .btn-wrapper {
      float: left;
      width: 25%;
      box-sizing: border-box;
    }

    .filter-item {
      padding-top: 16px;
      float: right;
      width: 25%;
      box-sizing: border-box;
    }
  }

  .btn-container-2 {
    .btn-wrapper {
      width: 220px;
      box-sizing: border-box;
      float: left;
    }

    .filter-item {
      padding-top: 16px;
      float: right;
      width: calc((100% - 310px) / 2);
      box-sizing: border-box;
    }

    .reset-btn {
      float: right;
      // margin-right: 16px;
      width: 70px;
      text-align: right;
      padding-top: 16px;
      margin-left: 20px;
    }
  }

  .btn-container-3 {
    .btn-wrapper {
      width: 100%;
      box-sizing: border-box;
      float: left;
    }

    .filter-item {
      float: left;
      width: calc((100% - 90px) / 3);
      box-sizing: border-box;
    }

    .reset-btn {
      float: left;
      // margin-right: 16px;
      width: 70px;
      text-align: right;

      .el-button {
        text-align: right;
      }
    }
  }
}

@media (min-width: 1201px) {
  .btn-container-1 {
    .btn-wrapper {
      width: 25%;
      box-sizing: border-box;
      float: left;
    }

    .filter-item {
      padding-top: 16px;
      float: right;
      width: 25%;
      box-sizing: border-box;
    }
  }

  .btn-container-2 {
    .btn-wrapper {
      width: 25%;
      box-sizing: border-box;
      float: left;
    }

    .filter-item {
      padding-top: 16px;
      float: right;
      width: 25%;
      box-sizing: border-box;
    }

    .reset-btn {
      float: right;
      // margin-right: 16px;
      width: 70px;
      text-align: right;
      padding-top: 16px;
      margin-left: 20px;
    }
  }

  .btn-container-3 {
    .btn-wrapper {
      width: 220px;
      box-sizing: border-box;
      float: left;
    }

    .filter-item {
      padding-top: 16px;
      float: left;
      width: calc((100% - 310px) / 3);
      box-sizing: border-box;
    }

    .reset-btn {
      padding-top: 16px;
      float: left;
      // margin-right: 16px;
      width: 70px;
      text-align: right;
    }
  }
}
</style>
