<template>
  <div class="home">
    <base-list
      :filterValue.sync="filterValue"
      :filters="filters"
      :columns="columns"
      :api="fetchData"
    >
    </base-list>
  </div>
</template>

<script>
import BaseList from "@/components/BaseList";
import BaseSelect from "@/components/BaseSelect";

export default {
  name: "Home",
  components: {
    BaseList,
  },
  data() {
    return {
      filterValue: {},
      filters: [
        {
          prop: "idOrTitle",
          label: "名称/ID",
          component: "el-input",
          placeholder: "课程名称/课程ID",
        },
        {
          prop: "visible",
          label: "可见性",
          component: BaseSelect,
          options: [
            {
              value: 0,
              label: "不可见",
            },
            {
              value: 1,
              label: "可见",
            },
          ],
          placeholder: "请选择可见性",
        },
        {
          prop: "dateRange",
          label: "日期范围",
          component: "el-date-picker",
          placeholder: "请选择日期范围",
        },
      ],
      columns: [
        {
          prop: "order",
          label: "序号",
          width: 60,
          render: ({ row, $index }) => {
            return $index;
          },
        },
        {
          prop: "name",
          label: "名字",
        },
        {
          prop: "age",
          label: "年龄",
          width: 120,
        },
        {
          prop: "address",
          label: "地址",
          width: 200,
        },
        {
          prop: "tags",
          label: "标签",
          width: 240,
          render: ({ row, $index }) => {
            return row.tags.map((tagName) => <el-tag>{tagName}</el-tag>);
          },
        },
        {
          label: "操作",
          prop: "action",
          width: 120,
          render: ({ row, $index }) => {
            return <el-Button type="text">删除</el-Button>;
          },
        },
      ],
    };
  },
  methods: {
    fetchData(params, pagination) {
      // eslint-disable-next-line no-console
      console.log("请求参数", params, pagination);
      // 替换成真实请求就行
      return new Promise((resolve) => {
        setTimeout(resolve, 300, {
          data: {
            total: 300,
            items: [
              {
                key: "1",
                name: "John Brown",
                age: 32,
                address: "New York No. 1 Lake Park",
                tags: ["nice", "developer"],
              },
              {
                key: "2",
                name: "Jim Green",
                age: 42,
                address: "London No. 1 Lake Park",
                tags: ["loser"],
              },
              {
                key: "3",
                name: "Joe Black",
                age: 32,
                address: "Sidney No. 1 Lake Park",
                tags: ["cool", "teacher"],
              },
            ],
          },
        });
      });
    },
  },
};
</script>
