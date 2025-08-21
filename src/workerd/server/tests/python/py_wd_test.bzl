load("@bazel_skylib//rules:copy_file.bzl", "copy_file")
load("@bazel_skylib//rules:expand_template.bzl", "expand_template")
load("//:build/python_metadata.bzl", "BUNDLE_VERSION_INFO")
load("//:build/wd_test.bzl", "wd_test")

def _get_enable_flags(python_flag):
    flags = [BUNDLE_VERSION_INFO[python_flag]["enable_flag_name"]]
    if "python_workers" not in flags:
        flags += ["python_workers"]
    return flags

def _py_wd_test_helper(
        name,
        src,
        python_flag,
        *,
        make_snapshot,
        use_snapshot,
        args,
        **kwargs):
    name_flag = name + "_" + python_flag
    templated_src = name_flag.replace("/", "-") + "@template"
    templated_src = "/".join(src.split("/")[:-1] + [templated_src])
    flags = _get_enable_flags(python_flag)
    feature_flags_txt = ",".join(['"{}"'.format(flag) for flag in flags])

    if use_snapshot:
        version_info = BUNDLE_VERSION_INFO[python_flag]

        make_snapshot = False
        snapshot = version_info[use_snapshot + "_snapshot"]
        data = data + [":python_snapshots"]
        args = args + ["--python-load-snapshot=" + snapshot]


    expand_template(
        name = name_flag + "@rule",
        out = templated_src,
        template = src,
        substitutions = {"%PYTHON_FEATURE_FLAGS": feature_flags_txt},
    )

    wd_test(
        src = templated_src,
        name = name_flag + "@",
        args = args,
        python_snapshot_test = make_snapshot,
        **kwargs
    )


def _snapshot_file(snapshot):
    if not snapshot:
        return []
    copy_file(
        name = "pyodide-snapshot-%s@copy" % snapshot,
        src = "@pyodide-snapshot-%s//file" % snapshot,
        out = snapshot,
        visibility = ["//visibility:public"],
    )
    return [":" + snapshot]

def _snapshot_files(
        baseline_snapshot = None,
        numpy_snapshot = None,
        fastapi_snapshot = None,
        **_kwds):
    result = []
    result += _snapshot_file(baseline_snapshot)
    result += _snapshot_file(numpy_snapshot)
    result += _snapshot_file(fastapi_snapshot)
    return result


def python_test_setup():
    copy_file(
        name = "pyodide_dev.capnp.bin@rule",
        src = "//src/pyodide:pyodide.capnp.bin_cross",
        out = "pyodide-bundle-cache/pyodide_dev.capnp.bin",
        visibility = ["//visibility:public"],
    )
    data = []
    for x in BUNDLE_VERSION_INFO.values():
        if x["name"] == "development":
            continue
        data += _snapshot_files(**x)

    native.filegroup(
        name = "python_snapshots",
        data = data,
        visibility = ["//visibility:public"],
    )



def py_wd_test(
        directory = None,
        *,
        src = None,
        data = None,
        name = None,
        python_flags = "all",
        skip_python_flags = [],
        args = [],
        size = "enormous",
        tags = [],
        make_snapshot = True,
        use_snapshot = None,
        **kwargs):
    if python_flags == "all":
        python_flags = BUNDLE_VERSION_INFO.keys()
    python_flags = [flag for flag in python_flags if flag not in skip_python_flags and flag in BUNDLE_VERSION_INFO]
    if data == None and directory != None:
        data = native.glob(
            [
                directory + "/**",
            ],
            exclude = ["**/*.wd-test"],
        )
    if src == None:
        src = native.glob([directory + "/*.wd-test"])[0]
    if name == None and directory != None:
        name = directory
    elif name == None:
        name = src.removesuffix(".wd-test")
    data += ["//src/workerd/server/tests/python:pyodide_dev.capnp.bin@rule"]
    args = args + [
        "--pyodide-bundle-disk-cache-dir",
        "$(location //src/workerd/server/tests/python:pyodide_dev.capnp.bin@rule)/..",
        "--experimental",
        "--pyodide-package-disk-cache-dir",
        ".",
    ]
    tags = tags + ["py_wd_test", "python"]

    for python_flag in python_flags:
        _py_wd_test_helper(
            name,
            src,
            python_flag,
            make_snapshot = make_snapshot,
            use_snapshot = use_snapshot,
            data = data,
            args = args,
            size = size,
            tags = tags,
        )
